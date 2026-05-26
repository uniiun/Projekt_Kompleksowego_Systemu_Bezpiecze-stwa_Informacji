from rest_framework import serializers

from .models import Department, Document


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class DocumentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )
    allowed_users_list = serializers.SlugRelatedField(
        many=True, slug_field="username", source="allowed_users", read_only=True
    )

    class Meta:
        model = Document
        fields = "__all__"
        read_only_fields = ["created_by"]
