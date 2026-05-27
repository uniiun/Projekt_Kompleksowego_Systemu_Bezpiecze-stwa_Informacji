from django.db import models
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Department, Document
from .permissions import IsAuthorizedForDocument
from .serializers import DepartmentSerializer, DocumentSerializer


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorizedForDocument]

    # Zwraca przefiltrowany zestaw danych dla akcji listowania lub pelny dla szczegolowych akcji
    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        queryset = Document.objects.all()

        # Dla akcji szczegolowych zwracamy pelny queryset (uprawnienia bada klasa IsAuthorizedForDocument)
        if self.action != "list":
            return queryset

        # Filtrowanie listy dokumentow w zaleznosci od roli uzytkownika
        if role == "ADMIN":
            return queryset

        if role == "MANAGER":
            return queryset.filter(
                models.Q(confidentiality_level="PUBLIC")
                | (
                    models.Q(confidentiality_level__in=["INTERNAL", "CONFIDENTIAL"])
                    & models.Q(department=user.profile.department)
                )
                | models.Q(allowed_users=user)
            ).distinct()

        if role == "EMPLOYEE":
            return queryset.filter(
                models.Q(confidentiality_level="PUBLIC")
                | (
                    models.Q(confidentiality_level="INTERNAL")
                    & models.Q(department=user.profile.department)
                )
                | models.Q(allowed_users=user)
            ).distinct()

        if role == "AUDITOR":
            return queryset.filter(
                models.Q(confidentiality_level__in=["PUBLIC", "INTERNAL"])
                | models.Q(allowed_users=user)
            ).distinct()

        return Document.objects.none()

    # Dodawanie nowego dokumentu z walidacja dzialu dla menedzera
    def create(self, request, *args, **kwargs):
        role = request.user.profile.role
        if role == "MANAGER":
            req_dept = request.data.get("department")
            if str(req_dept) != str(request.user.profile.department.id):
                return Response(
                    {"detail": "Możesz dodać dokument tylko do swojego działu."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        return super().create(request, *args, **kwargs)

    # Zapisuje uzytkownika tworzacego dokument
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # Pobieranie linku do pobrania pliku
    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        _ = pk
        instance = self.get_object()
        if instance.file:
            return Response({"url": instance.file.url})
        return Response({"detail": "Brak pliku."}, status=status.HTTP_404_NOT_FOUND)
