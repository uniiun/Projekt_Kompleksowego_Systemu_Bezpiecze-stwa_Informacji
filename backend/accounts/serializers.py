from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from documents.models import Department
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends SimpleJWT serializer to handle MFA requirement"""

    mfa_required = serializers.BooleanField(read_only=True)
    temp_token = serializers.CharField(read_only=True)
    mfa_methods = serializers.ListField(child=serializers.CharField(), read_only=True)

    def validate(self, attrs):
        if isinstance(attrs.get("username"), str) and "@" in attrs["username"]:
            user = User.objects.filter(email__iexact=attrs["username"]).first()
            if user:
                attrs["username"] = user.username

        # Standard authentication
        data = super().validate(attrs)
        user = self.user
        profile = Profile.objects.get(user=user)
        methods = []
        if profile.mfa_enabled:
            methods.append("TOTP")
        if profile.webauthn_enabled:
            methods.append("WEBAUTHN")

        if methods:
            # Issue a temporary token (use refresh token as temp)
            from rest_framework_simplejwt.tokens import RefreshToken

            temp = RefreshToken.for_user(user)
            data["mfa_required"] = True
            data["temp_token"] = str(temp)
            data["mfa_methods"] = methods
            # Remove access/refresh to enforce second step
            data.pop("access", None)
            data.pop("refresh", None)
        else:
            data["mfa_required"] = False
            data["temp_token"] = ""
            data["mfa_methods"] = []
        return data

    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "role",
            "department",
            "department_name",
            "mfa_enabled",
            "webauthn_enabled",
        ]


class ProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "role",
            "department",
            "department_name",
            "mfa_enabled",
            "webauthn_enabled",
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "profile",
        ]


class UserAdminSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        source="profile.role", choices=Profile.ROLE_CHOICES, required=False
    )
    department = serializers.PrimaryKeyRelatedField(
        source="profile.department",
        queryset=Department.objects.all(),
        required=False,
        allow_null=True,
    )
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=False, trim_whitespace=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "password",
            "role",
            "department",
        ]

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Haslo jest wymagane."})

        password = attrs.get("password")
        if password:
            try:
                validate_password(password, user=self.instance)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": list(exc.messages)})

        return attrs

    def create(self, validated_data):
        profile_data = validated_data.pop("profile", {})
        role = profile_data.get("role", "EMPLOYEE")
        department = profile_data.get("department")
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)
        profile = user.profile
        profile.role = role
        profile.department = department
        profile.save(update_fields=["role", "department"])
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if profile_data:
            profile = instance.profile
            if "role" in profile_data:
                profile.role = profile_data["role"]
            if "department" in profile_data:
                profile.department = profile_data["department"]
            profile.save(update_fields=["role", "department"])

        return instance
