from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import models
from django.shortcuts import get_object_or_404
from .models import Department, Document
from .serializers import DepartmentSerializer, DocumentSerializer
from audit.models import AccessLog

def log_access(user, document, action_name, success, request):
    ip_address = request.META.get('REMOTE_ADDR')
    AccessLog.objects.create(
        user=user,
        document=document,
        action=action_name,
        success=success,
        ip_address=ip_address
    )

class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        queryset = Document.objects.all()
        
        if role == 'ADMIN':
            return queryset
            
        if role == 'MANAGER':
            return queryset.filter(
                models.Q(department=user.profile.department) | 
                models.Q(confidentiality_level='PUBLIC') |
                models.Q(allowed_users=user)
            ).distinct()
            
        if role == 'EMPLOYEE':
            return queryset.filter(
                models.Q(confidentiality_level='PUBLIC') |
                (models.Q(confidentiality_level='INTERNAL') & models.Q(department=user.profile.department)) |
                models.Q(allowed_users=user)
            ).distinct()
            
        if role == 'AUDITOR':
            return queryset.filter(
                models.Q(confidentiality_level__in=['PUBLIC', 'INTERNAL']) |
                models.Q(allowed_users=user)
            ).distinct()
            
        return Document.objects.none()

    def list(self, request, *args, **kwargs):
        log_access(request.user, None, "VIEW_LIST", True, request)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            log_access(request.user, instance, "VIEW_DOCUMENT", True, request)
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            doc_id = kwargs.get('pk')
            doc = Document.objects.filter(pk=doc_id).first()
            if doc:
                log_access(request.user, doc, "ACCESS_DENIED", False, request)
                return Response({"detail": "Brak uprawnień do tego zasobu."}, status=status.HTTP_403_FORBIDDEN)
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request, *args, **kwargs):
        role = request.user.profile.role
        if role not in ['ADMIN', 'MANAGER']:
            log_access(request.user, None, "ACCESS_DENIED", False, request)
            return Response({"detail": "Brak uprawnień."}, status=status.HTTP_403_FORBIDDEN)
            
        if role == 'MANAGER':
            req_dept = request.data.get('department')
            if str(req_dept) != str(request.user.profile.department.id):
                log_access(request.user, None, "ACCESS_DENIED", False, request)
                return Response({"detail": "Możesz dodać dokument tylko do swojego działu."}, status=status.HTTP_403_FORBIDDEN)

        response = super().create(request, *args, **kwargs)
        doc = Document.objects.get(pk=response.data['id'])
        log_access(request.user, doc, "CREATE_DOCUMENT", True, request)
        return response

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        role = request.user.profile.role
        try:
            instance = self.get_object()
        except:
            doc_id = kwargs.get('pk')
            doc = Document.objects.filter(pk=doc_id).first()
            if doc:
                log_access(request.user, doc, "ACCESS_DENIED", False, request)
                return Response({"detail": "Brak uprawnień."}, status=status.HTTP_403_FORBIDDEN)
            return Response(status=status.HTTP_404_NOT_FOUND)

        if role not in ['ADMIN', 'MANAGER']:
            log_access(request.user, instance, "ACCESS_DENIED", False, request)
            return Response({"detail": "Brak uprawnień."}, status=status.HTTP_403_FORBIDDEN)

        if role == 'MANAGER' and instance.department != request.user.profile.department:
            log_access(request.user, instance, "ACCESS_DENIED", False, request)
            return Response({"detail": "Brak uprawnień."}, status=status.HTTP_403_FORBIDDEN)

        response = super().update(request, *args, **kwargs)
        log_access(request.user, instance, "UPDATE_DOCUMENT", True, request)
        return response

    def destroy(self, request, *args, **kwargs):
        role = request.user.profile.role
        if role != 'ADMIN':
            doc_id = kwargs.get('pk')
            doc = Document.objects.filter(pk=doc_id).first()
            if doc:
                log_access(request.user, doc, "ACCESS_DENIED", False, request)
            return Response({"detail": "Tylko administrator może usuwać dokumenty."}, status=status.HTTP_403_FORBIDDEN)
            
        instance = self.get_object()
        log_access(request.user, instance, "DELETE_DOCUMENT", True, request)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        try:
            instance = self.get_object()
            log_access(request.user, instance, "DOWNLOAD_DOCUMENT", True, request)
            if instance.file:
                return Response({"url": instance.file.url})
            return Response({"detail": "Brak pliku."})
        except:
            doc = Document.objects.filter(pk=pk).first()
            if doc:
                log_access(request.user, doc, "ACCESS_DENIED", False, request)
                return Response({"detail": "Brak uprawnień."}, status=status.HTTP_403_FORBIDDEN)
            return Response(status=status.HTTP_404_NOT_FOUND)
