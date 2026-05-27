from django.contrib.auth.models import User
from django.test import TestCase
from documents.models import Department, Document
from rest_framework import status
from rest_framework.test import APIClient


class DocumentViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept_it = Department.objects.create(name="IT")
        self.dept_hr = Department.objects.create(name="HR")

        self.manager = User.objects.create_user(
            username="manager_it",
            email="manager.it@example.com",
            password="password123",
        )
        self.manager.profile.role = "MANAGER"
        self.manager.profile.department = self.dept_it
        self.manager.profile.save()

        self.doc_no_file = Document.objects.create(
            title="No File",
            department=self.dept_it,
            confidentiality_level="INTERNAL",
        )

    def test_manager_cannot_create_document_in_other_department(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            "/api/documents/",
            {
                "title": "HR Internal",
                "department": self.dept_hr.id,
                "confidentiality_level": "INTERNAL",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_download_without_file_returns_404(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(f"/api/documents/{self.doc_no_file.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
