import base64
import json

from audit.models import AccessLog
from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import WebAuthnCredential
from .permissions import IsAdminRole
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserAdminSerializer,
    UserSerializer,
)


def _b64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data):
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def _get_webauthn_context(request):
    origin = request.headers.get("Origin") or settings.WEBAUTHN_ORIGIN
    rp_id = settings.WEBAUTHN_RP_ID or request.get_host().split(":")[0]
    rp_name = settings.WEBAUTHN_RP_NAME
    return rp_id, rp_name, origin


def _load_webauthn_lib():
    try:
        from webauthn import (
            generate_authentication_options,
            generate_registration_options,
            verify_authentication_response,
            verify_registration_response,
        )
        from webauthn.helpers import options_to_json
        from webauthn.helpers.structs import (
            AttestationConveyancePreference,
            AuthenticationCredential,
            AuthenticatorSelectionCriteria,
            PublicKeyCredentialDescriptor,
            PublicKeyCredentialType,
            RegistrationCredential,
            UserVerificationRequirement,
        )

        return {
            "generate_authentication_options": generate_authentication_options,
            "generate_registration_options": generate_registration_options,
            "verify_authentication_response": verify_authentication_response,
            "verify_registration_response": verify_registration_response,
            "options_to_json": options_to_json,
            "AttestationConveyancePreference": AttestationConveyancePreference,
            "AuthenticationCredential": AuthenticationCredential,
            "AuthenticatorSelectionCriteria": AuthenticatorSelectionCriteria,
            "PublicKeyCredentialDescriptor": PublicKeyCredentialDescriptor,
            "PublicKeyCredentialType": PublicKeyCredentialType,
            "RegistrationCredential": RegistrationCredential,
            "UserVerificationRequirement": UserVerificationRequirement,
        }
    except ImportError:
        return None


def _options_to_dict(lib, options):
    return json.loads(lib["options_to_json"](options))


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return UserAdminSerializer
        return UserSerializer

    def _get_client_ip(self, request):
        ip_address = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip_address:
            return ip_address.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")

    def _log_user_action(self, action, target_user, success, message):
        AccessLog.objects.create(
            user=self.request.user,
            document=None,
            action=action,
            success=success,
            ip_address=self._get_client_ip(self.request),
            message=message,
        )

    def _active_admin_count(self):
        return User.objects.filter(is_active=True, profile__role="ADMIN").count()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code < 400:
            target_id = response.data.get("id")
            target_user = User.objects.filter(pk=target_id).first()
            if target_user:
                self._log_user_action(
                    "USER_CREATE",
                    target_user,
                    True,
                    f"Utworzono uzytkownika {target_user.username}.",
                )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        before_role = instance.profile.role
        before_department = instance.profile.department_id
        before_active = instance.is_active

        response = super().update(request, *args, **kwargs)
        if response.status_code < 400:
            instance.refresh_from_db()
            if instance.profile.role != before_role:
                self._log_user_action(
                    "USER_ROLE_CHANGE",
                    instance,
                    True,
                    f"Zmiana roli na {instance.profile.role}.",
                )
            if instance.profile.department_id != before_department:
                self._log_user_action(
                    "USER_DEPARTMENT_CHANGE",
                    instance,
                    True,
                    "Zmiana dzialu uzytkownika.",
                )
            if instance.is_active != before_active:
                action = "USER_ACTIVATE" if instance.is_active else "USER_DEACTIVATE"
                self._log_user_action(action, instance, True, "Zmiana statusu konta.")

        return response

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        _ = pk
        target_user = self.get_object()
        if target_user == request.user:
            return Response(
                {"detail": "Nie mozesz zdezaktywowac wlasnego konta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not target_user.is_active:
            return Response(
                {"detail": "Uzytkownik jest juz zdezaktywowany."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if target_user.profile.role == "ADMIN" and self._active_admin_count() <= 1:
            return Response(
                {"detail": "Nie mozna zdezaktywowac ostatniego administratora."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.is_active = False
        target_user.save(update_fields=["is_active"])
        self._log_user_action(
            "USER_DEACTIVATE", target_user, True, "Dezaktywacja konta uzytkownika."
        )
        return Response(UserSerializer(target_user).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        _ = pk
        target_user = self.get_object()
        if target_user.is_active:
            return Response(
                {"detail": "Uzytkownik jest juz aktywny."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.is_active = True
        target_user.save(update_fields=["is_active"])
        self._log_user_action(
            "USER_ACTIVATE", target_user, True, "Aktywacja konta uzytkownika."
        )
        return Response(UserSerializer(target_user).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reset-mfa")
    def reset_mfa(self, request, pk=None):
        _ = pk
        target_user = self.get_object()
        profile = target_user.profile
        profile.mfa_enabled = False
        profile.totp_secret = ""
        profile.mfa_backup_codes = ""
        profile.webauthn_enabled = False
        profile.save(
            update_fields=[
                "mfa_enabled",
                "totp_secret",
                "mfa_backup_codes",
                "webauthn_enabled",
            ]
        )
        WebAuthnCredential.objects.filter(user=target_user).delete()
        self._log_user_action(
            "USER_RESET_MFA", target_user, True, "Reset MFA dla uzytkownika."
        )
        return Response(
            {"mfa_enabled": False, "webauthn_enabled": False},
            status=status.HTTP_200_OK,
        )


class EnableMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        secret, backup_codes = profile.enable_mfa()
        return Response(
            {
                "totp_secret": secret,
                "backup_codes": backup_codes,
                "mfa_enabled": profile.mfa_enabled,
            },
            status=status.HTTP_200_OK,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class VerifyMFAView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")
        temp_token = request.data.get("temp_token")
        if not token or not temp_token:
            return Response(
                {"detail": "Token i temp_token są wymagane."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(temp_token)
            user_id = refresh["user_id"]
            user = User.objects.get(id=user_id)
        except Exception:
            return Response(
                {"detail": "Nieprawidłowy temp_token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        profile = user.profile
        if not profile.mfa_enabled:
            return Response(
                {"detail": "MFA nie jest aktywne dla tego konta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not profile.verify_otp(token):
            return Response(
                {"detail": "Nieprawidłowy kod MFA."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "mfa_required": False,
            },
            status=status.HTTP_200_OK,
        )


class DisableMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        profile.mfa_enabled = False
        profile.totp_secret = ""
        profile.mfa_backup_codes = ""
        profile.save()
        return Response({"mfa_enabled": False}, status=status.HTTP_200_OK)


class WebAuthnRegistrationOptionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        lib = _load_webauthn_lib()
        if not lib:
            return Response(
                {"detail": "Brak biblioteki webauthn. Zainstaluj zaleznosci backendu."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        rp_id, rp_name, _origin = _get_webauthn_context(request)
        user = request.user

        exclude_credentials = []
        for credential in user.webauthn_credentials.all():
            exclude_credentials.append(
                lib["PublicKeyCredentialDescriptor"](
                    id=_b64url_decode(credential.credential_id),
                    type=lib["PublicKeyCredentialType"].PUBLIC_KEY,
                )
            )

        selection = lib["AuthenticatorSelectionCriteria"](
            user_verification=lib["UserVerificationRequirement"].PREFERRED,
        )
        options = lib["generate_registration_options"](
            rp_id=rp_id,
            rp_name=rp_name,
            user_id=str(user.id).encode("utf-8"),
            user_name=user.username or user.email,
            user_display_name=user.get_full_name() or user.username or user.email,
            attestation=lib["AttestationConveyancePreference"].NONE,
            authenticator_selection=selection,
            exclude_credentials=exclude_credentials,
        )

        cache.set(f"webauthn:reg:{user.id}", options.challenge, timeout=300)
        return Response(
            {"options": _options_to_dict(lib, options)}, status=status.HTTP_200_OK
        )


class WebAuthnRegistrationVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        lib = _load_webauthn_lib()
        if not lib:
            return Response(
                {"detail": "Brak biblioteki webauthn. Zainstaluj zaleznosci backendu."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        credential_data = request.data.get("credential")
        if not credential_data:
            return Response(
                {"detail": "Brak danych uwierzytelniania."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rp_id, _rp_name, origin = _get_webauthn_context(request)
        expected_challenge = cache.get(f"webauthn:reg:{request.user.id}")
        if not expected_challenge:
            return Response(
                {"detail": "Brak wyzwania rejestracji. Sprobuj ponownie."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verified = lib["verify_registration_response"](
                credential=lib["RegistrationCredential"].parse_raw(
                    json.dumps(credential_data)
                ),
                expected_challenge=expected_challenge,
                expected_rp_id=rp_id,
                expected_origin=origin,
                require_user_verification=True,
            )
        except Exception:
            return Response(
                {"detail": "Nieprawidlowa odpowiedz rejestracji WebAuthn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        credential_id = _b64url_encode(verified.credential_id)
        public_key = _b64url_encode(verified.credential_public_key)
        transports = credential_data.get("transports")

        WebAuthnCredential.objects.update_or_create(
            user=request.user,
            credential_id=credential_id,
            defaults={
                "public_key": public_key,
                "sign_count": verified.sign_count,
                "transports": ",".join(transports) if transports else "",
                "last_used_at": timezone.now(),
            },
        )

        profile = request.user.profile
        profile.webauthn_enabled = True
        profile.save(update_fields=["webauthn_enabled"])

        return Response(
            {"webauthn_enabled": True, "credential_id": credential_id},
            status=status.HTTP_200_OK,
        )


class WebAuthnAuthenticationOptionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        lib = _load_webauthn_lib()
        if not lib:
            return Response(
                {"detail": "Brak biblioteki webauthn. Zainstaluj zaleznosci backendu."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        temp_token = request.data.get("temp_token")
        if not temp_token:
            return Response(
                {"detail": "temp_token jest wymagany."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(temp_token)
            user_id = refresh["user_id"]
            user = User.objects.get(id=user_id)
        except Exception:
            return Response(
                {"detail": "Nieprawidlowy temp_token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        credentials = list(user.webauthn_credentials.all())
        if not credentials:
            return Response(
                {"detail": "Brak zarejestrowanych kluczy WebAuthn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allow_credentials = []
        for credential in credentials:
            allow_credentials.append(
                lib["PublicKeyCredentialDescriptor"](
                    id=_b64url_decode(credential.credential_id),
                    type=lib["PublicKeyCredentialType"].PUBLIC_KEY,
                )
            )

        options = lib["generate_authentication_options"](
            rp_id=settings.WEBAUTHN_RP_ID,
            allow_credentials=allow_credentials,
            user_verification=lib["UserVerificationRequirement"].PREFERRED,
        )

        cache.set(
            f"webauthn:auth:{temp_token}",
            {"challenge": options.challenge, "user_id": user.id},
            timeout=300,
        )
        return Response(
            {"options": _options_to_dict(lib, options)}, status=status.HTTP_200_OK
        )


class WebAuthnAuthenticationVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        lib = _load_webauthn_lib()
        if not lib:
            return Response(
                {"detail": "Brak biblioteki webauthn. Zainstaluj zaleznosci backendu."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        temp_token = request.data.get("temp_token")
        credential_data = request.data.get("credential")
        if not temp_token or not credential_data:
            return Response(
                {"detail": "temp_token i credential sa wymagane."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cached = cache.get(f"webauthn:auth:{temp_token}")
        if not cached:
            return Response(
                {"detail": "Brak wyzwania logowania. Sprobuj ponownie."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected_challenge = cached["challenge"]
        user_id = cached["user_id"]

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Nieprawidlowy uzytkownik."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        credential_id = credential_data.get("id")
        if not credential_id:
            return Response(
                {"detail": "Brak identyfikatora klucza."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            db_credential = user.webauthn_credentials.get(credential_id=credential_id)
        except WebAuthnCredential.DoesNotExist:
            return Response(
                {"detail": "Nieznany klucz WebAuthn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rp_id, _rp_name, origin = _get_webauthn_context(request)

        try:
            verified = lib["verify_authentication_response"](
                credential=lib["AuthenticationCredential"].parse_raw(
                    json.dumps(credential_data)
                ),
                expected_challenge=expected_challenge,
                expected_rp_id=rp_id,
                expected_origin=origin,
                credential_public_key=_b64url_decode(db_credential.public_key),
                credential_current_sign_count=db_credential.sign_count,
                require_user_verification=True,
            )
        except Exception:
            return Response(
                {"detail": "Nieprawidlowa odpowiedz WebAuthn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db_credential.sign_count = verified.new_sign_count
        db_credential.last_used_at = timezone.now()
        db_credential.save(update_fields=["sign_count", "last_used_at"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "mfa_required": False,
            },
            status=status.HTTP_200_OK,
        )


class WebAuthnDisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        WebAuthnCredential.objects.filter(user=request.user).delete()
        profile = request.user.profile
        profile.webauthn_enabled = False
        profile.save(update_fields=["webauthn_enabled"])
        return Response({"webauthn_enabled": False}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Stare i nowe hasło są wymagane."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"detail": "Niepoprawne obecne hasło."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Walidacja nowego hasla za pomoca walidatorow Django
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response(
                {"detail": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # Uaktualnienie daty zmiany hasla w profilu
        profile = user.profile
        profile.password_changed_at = timezone.now()
        profile.save(update_fields=["password_changed_at"])

        return Response(
            {"detail": "Hasło zostało pomyślnie zmienione."},
            status=status.HTTP_200_OK,
        )
