from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer


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


class VerifyMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Token not provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        profile = request.user.profile
        if profile.verify_otp(token):
            return Response({"success": True}, status=status.HTTP_200_OK)
        return Response({"success": False}, status=status.HTTP_400_BAD_REQUEST)


class DisableMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        profile.mfa_enabled = False
        profile.totp_secret = ""
        profile.save()
        return Response({"mfa_enabled": False}, status=status.HTTP_200_OK)
