from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Profile
        fields = ["role", "department", "department_name"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "profile"]
