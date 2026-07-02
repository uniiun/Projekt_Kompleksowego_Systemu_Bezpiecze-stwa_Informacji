import os
import xml.etree.ElementTree as ET
import zipfile

from django.db import models
from django.http import HttpResponse
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .encryption import decrypt_bytes, encrypt_bytes
from .models import Department, Document
from .permissions import IsAuthorizedForDocument
from .serializers import DepartmentSerializer, DocumentSerializer


def _get_docx_text_from_bytes(raw_bytes):
    # Wyciagniecie tekstu z pliku docx przekazanego jako bajty
    import io

    try:
        with zipfile.ZipFile(io.BytesIO(raw_bytes)) as document:
            xml_content = document.read("word/document.xml")
        tree = ET.XML(xml_content)
        WORD_NAMESPACE = (
            "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        )
        PARA = WORD_NAMESPACE + "p"
        TEXT = WORD_NAMESPACE + "t"
        paragraphs = []
        for paragraph in tree.iter(PARA):
            texts = [node.text for node in paragraph.iter(TEXT) if node.text]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Błąd odczytu pliku docx: {str(e)}"


def _read_file_bytes(instance):
    # Wczytanie bajtow pliku z dysku; deszyfrowanie jesli plik jest zaszyfrowany
    if not instance.file:
        return None
    with open(instance.file.path, "rb") as f:
        raw = f.read()
    if instance.file_encrypted:
        raw = decrypt_bytes(raw)
    return raw


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorizedForDocument]

    # Zwraca przefiltrowany zestaw danych dla akcji listowania lub pelny dla szczegolowych akcji
    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        queryset = Document.objects.all()

        # Dla akcji szczegolowych zwracamy pelny queryset (uprawnienia bada klasa IsAuthorizedForDocument)
        if self.action != "list":
            return queryset

        # Filtrowanie listy dokumentow w zaleznosci od roli uzytkownika
        if role == "ADMIN":
            return queryset

        if role == "MANAGER":
            return queryset.filter(
                models.Q(confidentiality_level="PUBLIC")
                | (
                    models.Q(confidentiality_level__in=["INTERNAL", "CONFIDENTIAL"])
                    & models.Q(department=user.profile.department)
                )
                | models.Q(allowed_users=user)
            ).distinct()

        if role == "EMPLOYEE":
            return queryset.filter(
                models.Q(confidentiality_level="PUBLIC")
                | (
                    models.Q(confidentiality_level="INTERNAL")
                    & models.Q(department=user.profile.department)
                )
                | models.Q(allowed_users=user)
            ).distinct()

        if role == "AUDITOR":
            return queryset.filter(
                models.Q(confidentiality_level__in=["PUBLIC", "INTERNAL"])
                | models.Q(allowed_users=user)
            ).distinct()

        return Document.objects.none()

    # Walidacja ograniczen dla menedzera i nie-admina
    def _validate_restricted_fields(self, request):
        role = request.user.profile.role
        confidentiality_level = request.data.get("confidentiality_level")
        if role != "ADMIN":
            if confidentiality_level == "SECRET":
                return Response(
                    {"detail": "Tylko ADMIN moze ustawic poziom SECRET."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if "allowed_users" in request.data:
                return Response(
                    {"detail": "Tylko ADMIN moze modyfikowac allowed_users."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return None

    # Dodawanie nowego dokumentu z walidacja dzialu dla menedzera
    def create(self, request, *args, **kwargs):
        restriction_error = self._validate_restricted_fields(request)
        if restriction_error:
            return restriction_error

        role = request.user.profile.role
        if role == "MANAGER":
            req_dept = request.data.get("department")
            manager_dept = request.user.profile.department
            if manager_dept is None:
                return Response(
                    {
                        "detail": "Twoje konto nie jest przypisane do żadnego działu. Skontaktuj się z administratorem."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            if str(req_dept) != str(manager_dept.id):
                return Response(
                    {"detail": "Możesz dodać dokument tylko do swojego działu."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        restriction_error = self._validate_restricted_fields(request)
        if restriction_error:
            return restriction_error
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        restriction_error = self._validate_restricted_fields(request)
        if restriction_error:
            return restriction_error
        return super().partial_update(request, *args, **kwargs)

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        self._run_dlp_scan(instance)
        self._encrypt_file_if_present(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        # Szyfrowanie tylko jesli w tym zapytaniu przeslano nowy plik
        if "file" in self.request.FILES:
            self._run_dlp_scan(instance)
            self._encrypt_file_if_present(instance)
        else:
            self._run_dlp_scan(instance, skip_file=True)

    def _run_dlp_scan(self, instance, skip_file=False):
        from audit.models import AccessLog
        from .dlp import scan_document
        
        file_bytes = None
        if not skip_file and instance.file:
            try:
                # Read raw bytes before encryption
                with open(instance.file.path, "rb") as f:
                    file_bytes = f.read()
            except Exception:
                pass
                
        result = scan_document(instance, file_bytes)
        if result.get("has_sensitive_data"):
            # Automatyczne podniesienie poufnosci dla bezpieczenstwa
            if instance.confidentiality_level in ["PUBLIC", "INTERNAL"]:
                instance.confidentiality_level = "CONFIDENTIAL"
                instance.save(update_fields=["confidentiality_level"])
                
            types_str = ", ".join(result.get("types", []))
            AccessLog.objects.create(
                user=self.request.user,
                document=instance,
                action="DLP_ALERT",
                success=True,
                ip_address=self.request.META.get("REMOTE_ADDR"),
                message=f"Skaner DLP wykrył dane wrażliwe: {types_str}. Zabezpieczono dokument jako POUFNY."
            )

    def _encrypt_file_if_present(self, instance):
        # Szyfrowanie pliku na dysku za pomoca Fernet po pomyslnym zapisie
        if not instance.file:
            return
        try:
            with open(instance.file.path, "rb") as f:
                raw = f.read()
                
            import hashlib
            file_hash = hashlib.sha256(raw).hexdigest()
            instance.file_hash = file_hash
            
            encrypted = encrypt_bytes(raw)
            with open(instance.file.path, "wb") as f:
                f.write(encrypted)
            instance.file_encrypted = True
            instance.save(update_fields=["file_encrypted", "file_hash"])
        except Exception:
            pass

    # Pobieranie pliku - odszyfrowanie w locie i zwrocenie jako strumien
    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        _ = pk
        instance = self.get_object()
        if not instance.file:
            return Response({"detail": "Brak pliku."}, status=status.HTTP_404_NOT_FOUND)

        raw = _read_file_bytes(instance)
        if raw is None:
            return Response(
                {"detail": "Nie mozna odczytac pliku."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        filename = os.path.basename(instance.file.name)
        response = HttpResponse(raw, content_type="application/octet-stream")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(raw)
        # Zezwolenie na otwarcie w nowej karcie przez przeglądarkę
        response["X-Frame-Options"] = "ALLOWALL"
        return response

    # Podglad zawartosci pliku - odszyfrowanie w locie
    @action(detail=True, methods=["get"])
    def preview_content(self, request, pk=None):
        _ = pk
        instance = self.get_object()
        if not instance.file:
            return Response({"detail": "Brak pliku."}, status=status.HTTP_404_NOT_FOUND)

        raw = _read_file_bytes(instance)
        if raw is None:
            return Response(
                {"detail": "Nie mozna odczytac pliku."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        file_path = instance.file.name
        ext = file_path.split(".")[-1].lower() if "." in file_path else ""

        if ext == "docx":
            text = _get_docx_text_from_bytes(raw)
            return Response({"type": "text", "content": text})
        elif ext in ["txt", "csv", "md"]:
            try:
                text = raw.decode("utf-8")
                return Response({"type": "text", "content": text})
            except Exception as e:
                return Response({"type": "error", "content": str(e)})

        return Response({"type": "unsupported", "content": ""})
