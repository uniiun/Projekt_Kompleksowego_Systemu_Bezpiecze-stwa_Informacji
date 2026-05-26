from rest_framework import serializers

from .models import AccessLog


class AccessLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    document_title = serializers.CharField(source="document.title", read_only=True)

    class Meta:
        model = AccessLog
        fields = "__all__"
