from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends SimpleJWT serializer to handle MFA requirement"""

    mfa_required = serializers.BooleanField(read_only=True)
    temp_token = serializers.CharField(read_only=True)

    def validate(self, attrs):
        # Standard authentication
        data = super().validate(attrs)
        user = self.user
        profile = Profile.objects.get(user=user)
        if profile.mfa_enabled:
            # Issue a temporary token (use refresh token as temp)
            from rest_framework_simplejwt.tokens import RefreshToken

            temp = RefreshToken.for_user(user)
            data["mfa_required"] = True
            data["temp_token"] = str(temp)
            # Remove access/refresh to enforce second step
            data.pop("access", None)
            data.pop("refresh", None)
        else:
            data["mfa_required"] = False
            data["temp_token"] = ""
        return data

    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Profile
        fields = ["role", "department", "department_name", "mfa_enabled"]


class ProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Profile
        fields = ["role", "department", "department_name", "mfa_enabled"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "profile"]
