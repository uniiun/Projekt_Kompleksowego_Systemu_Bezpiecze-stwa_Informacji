import zipfile
import xml.etree.ElementTree as ET

from django.db import models
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Department, Document

def get_docx_text(path):
    try:
        with zipfile.ZipFile(path) as document:
            xml_content = document.read("word/document.xml")
        tree = ET.XML(xml_content)
        WORD_NAMESPACE = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        PARA = WORD_NAMESPACE + "p"
        TEXT = WORD_NAMESPACE + "t"
        paragraphs = []
        for paragraph in tree.iter(PARA):
            texts = [node.text for node in paragraph.iter(TEXT) if node.text]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Błąd odczytu pliku docx: {str(e)}"
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
    def _validate_restricted_fields(self, request):
        role = request.user.profile.role
        confidentiality_level = request.data.get("confidentiality_level")
        if role != "ADMIN":
            if confidentiality_level == "SECRET":
                return Response(
                    {"detail": "Tylko ADMIN moze ustawic poziom SECRET."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if "allowed_users" in request.data:
                return Response(
                    {"detail": "Tylko ADMIN moze modyfikowac allowed_users."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return None

    # Dodawanie nowego dokumentu z walidacja dzialu dla menedzera
    def create(self, request, *args, **kwargs):
        restriction_error = self._validate_restricted_fields(request)
        if restriction_error:
            return restriction_error

        role = request.user.profile.role
        if role == "MANAGER":
            req_dept = request.data.get("department")
            if str(req_dept) != str(request.user.profile.department.id):
                return Response(
                    {"detail": "Możesz dodać dokument tylko do swojego działu."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        restriction_error = self._validate_restricted_fields(request)
        if restriction_error:
            return restriction_error
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        restriction_error = self._validate_restricted_fields(request)
        if restriction_error:
            return restriction_error
        return super().partial_update(request, *args, **kwargs)

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

    @action(detail=True, methods=["get"])
    def preview_content(self, request, pk=None):
        _ = pk
        instance = self.get_object()
        if not instance.file:
            return Response({"detail": "Brak pliku."}, status=status.HTTP_404_NOT_FOUND)
        
        file_path = instance.file.path
        ext = file_path.split('.')[-1].lower() if '.' in file_path else ''
        
        if ext == 'docx':
            text = get_docx_text(file_path)
            return Response({"type": "text", "content": text})
        elif ext in ['txt', 'csv', 'md']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
                return Response({"type": "text", "content": text})
            except Exception as e:
                return Response({"type": "error", "content": str(e)})
        
        return Response({"type": "unsupported", "content": ""})
