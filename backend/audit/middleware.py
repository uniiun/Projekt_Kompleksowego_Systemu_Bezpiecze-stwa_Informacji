import json

from audit.models import AccessLog
from django.contrib.auth.models import User
from django.urls import resolve
from django.utils.deprecation import MiddlewareMixin
from documents.models import Document


# Klasa middleware do automatycznego logowania zdarzen audytowych (Audit Engine)
class AuditMiddleware(MiddlewareMixin):

    # Wymuszenie buforowania body przed odczytem strumienia przez DRF (dla logowania)
    def process_request(self, request):
        if request.path.startswith("/api/auth/login/"):
            try:
                _ = request.body
            except Exception:
                pass

    # Przetwarzanie odpowiedzi HTTP do celow logowania zdarzen dostepowych
    def process_response(self, request, response):
        # Pomijanie panelu administracyjnego Django oraz plikow statycznych
        if request.path.startswith("/admin/") or request.path.startswith("/static/"):
            return response

        # Dopasowanie sciezki URL do widokow Django
        try:
            resolver_match = resolve(request.path_info)
        except Exception:
            return response

        view_name = resolver_match.view_name
        url_name = resolver_match.url_name
        kwargs = resolver_match.kwargs

        # Ustalenie zalogowanego uzytkownika
        user = request.user if request.user and request.user.is_authenticated else None
        action = None
        document = None
        success = response.status_code < 400

        # Identyfikacja akcji na podstawie nazwy widoku i metody HTTP
        if view_name == "document-list":
            if request.method == "GET":
                action = "VIEW_LIST"
            elif request.method == "POST":
                action = "CREATE_DOCUMENT"
                if success:
                    try:
                        # Pobranie id nowo utworzonego dokumentu z odpowiedzi
                        resp_data = getattr(response, "data", {})
                        doc_id = resp_data.get("id")
                        if doc_id:
                            document = Document.objects.filter(pk=doc_id).first()
                    except Exception:
                        pass

        elif view_name == "document-detail":
            doc_id = kwargs.get("pk")
            document = Document.objects.filter(pk=doc_id).first()
            if request.method == "GET":
                action = "VIEW_DOCUMENT"
            elif request.method in ["PUT", "PATCH"]:
                action = "UPDATE_DOCUMENT"
            elif request.method == "DELETE":
                action = "DELETE_DOCUMENT"

        elif view_name == "document-download":
            doc_id = kwargs.get("pk")
            document = Document.objects.filter(pk=doc_id).first()
            action = "DOWNLOAD_DOCUMENT"

        elif url_name == "token_obtain_pair":
            action = "LOGIN"
            if request.method == "POST":
                try:
                    # Wyciagniecie nazwy uzytkownika z body zapytania w przypadku logowania
                    body = json.loads(request.body.decode("utf-8"))
                    username = body.get("username")
                    if username:
                        user = User.objects.filter(username=username).first()
                except Exception:
                    pass

        # Jezeli akcja zostala poprawnie zidentyfikowana, zapisujemy ja w logach
        if action:
            # W przypadku braku autoryzacji nadpisujemy akcje na ACCESS_DENIED
            if response.status_code in [401, 403]:
                action = "ACCESS_DENIED"
                success = False

            # Pobranie adresu IP klienta
            ip_address = request.META.get("HTTP_X_FORWARDED_FOR")
            if ip_address:
                ip_address = ip_address.split(",")[0].strip()
            else:
                ip_address = request.META.get("REMOTE_ADDR")

            # Tworzenie rekordu w bazie danych
            AccessLog.objects.create(
                user=user,
                document=document,
                action=action,
                success=success,
                ip_address=ip_address,
                message=f"Status HTTP: {response.status_code}",
            )

        return response
