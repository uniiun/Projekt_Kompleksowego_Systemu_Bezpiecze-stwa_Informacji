from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer, UserSerializer


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class EnableMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        secret = profile.enable_mfa()
        return Response(
            {"totp_secret": secret, "mfa_enabled": profile.mfa_enabled},
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
        profile.save()
        return Response({"mfa_enabled": False}, status=status.HTTP_200_OK)
