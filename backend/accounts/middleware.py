from django.http import JsonResponse
from django.utils import timezone


# Middleware wymuszajacy zmiane hasla co 30 dni
class PasswordExpiryMiddleware:

    # Sciezki wykluczone z weryfikacji wygasniecia hasla
    EXEMPT_PATHS = {
        "/api/auth/login/",
        "/api/auth/refresh/",
        "/api/auth/verify-totp/",
        "/api/auth/change-password/",
        "/api/me/",
        "/api/auth/mfa/enable/",
        "/api/auth/mfa/disable/",
        "/api/auth/webauthn/register/options/",
        "/api/auth/webauthn/register/verify/",
        "/api/auth/webauthn/authenticate/options/",
        "/api/auth/webauthn/authenticate/verify/",
        "/api/auth/webauthn/disable/",
        "/api/diagnostics/",
        "/admin/",
        "/static/",
        "/media/",
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Sprawdzanie wygasniecia hasla tylko dla zalogowanych uzytkownikow
        if self._is_exempt(request.path):
            return self.get_response(request)

        user = self._resolve_user(request)

        if user and user.is_authenticated:
            try:
                profile = user.profile
                if profile.password_changed_at:
                    days_since = (timezone.now() - profile.password_changed_at).days
                    if days_since >= 30:
                        return JsonResponse(
                            {
                                "detail": "Hasło wygasło. Zmień hasło, aby kontynuować.",
                                "code": "PASSWORD_EXPIRED",
                            },
                            status=403,
                        )
            except Exception:
                pass

        return self.get_response(request)

    def _resolve_user(self, request):
        # Django AuthenticationMiddleware ustawia uzytkownika dla sesji,
        # ale JWT jest parsowany przez DRF dopiero na poziomie widoku.
        # Dlatego recznie wywolujemy JWTAuthentication jesli user jest anonimowy.
        if hasattr(request, "user") and request.user.is_authenticated:
            return request.user

        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication

            jwt_auth = JWTAuthentication()
            result = jwt_auth.authenticate(request)
            if result:
                return result[0]
        except Exception:
            pass

        return None

    def _is_exempt(self, path):
        for exempt in self.EXEMPT_PATHS:
            if path.startswith(exempt):
                return True
        return False
