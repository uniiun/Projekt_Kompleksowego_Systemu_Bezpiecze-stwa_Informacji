from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import AccessLog
from .serializers import AccessLogSerializer

class AccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        
        if role in ['ADMIN', 'AUDITOR']:
            return AccessLog.objects.all().order_by('-created_at')
            
        return AccessLog.objects.none()

    def list(self, request, *args, **kwargs):
        role = request.user.profile.role
        if role not in ['ADMIN', 'AUDITOR']:
            return Response({"detail": "Brak uprawnień do tego zasobu."}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)
