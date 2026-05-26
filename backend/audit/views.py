from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from .models import AccessLog
from .serializers import AccessLogSerializer


class AccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        queryset = AccessLog.objects.all().order_by("-created_at")

        if role in ["ADMIN", "AUDITOR"]:
            pass  # Full access
        elif role == "MANAGER":
            # Manager can see logs related to documents in their department
            queryset = queryset.filter(document__department=user.profile.department)
        else:
            return AccessLog.objects.none()

        document_id = self.request.query_params.get("document")
        if document_id:
            queryset = queryset.filter(document_id=document_id)

        return queryset

    def list(self, request, *args, **kwargs):
        role = request.user.profile.role
        if role not in ["ADMIN", "AUDITOR", "MANAGER"]:
            return Response(
                {"detail": "Brak uprawnień do tego zasobu."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().list(request, *args, **kwargs)
