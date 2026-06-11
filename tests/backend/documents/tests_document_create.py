# Testy dokumentow: tworzenie z walidacja dzialu, dostep do szczegolowych widokow, szyfrowanie
from django.contrib.auth.models import User
from django.test import TestCase
from documents.models import Department, Document
from rest_framework import status
from rest_framework.test import APIClient


class DocumentCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept_it = Department.objects.create(name="IT")
        self.dept_hr = Department.objects.create(name="HR")

        self.admin = User.objects.create_user(
            username="admin_doc",
            email="admin_doc@example.com",
            password="password123",
        )
        self.admin.profile.role = "ADMIN"
        self.admin.profile.save()

        # Manager z przypisanym dzialem
        self.manager_it = User.objects.create_user(
            username="manager_doc_it",
            email="manager_it@example.com",
            password="password123",
        )
        self.manager_it.profile.role = "MANAGER"
        self.manager_it.profile.department = self.dept_it
        self.manager_it.profile.save()

        # Manager BEZ przypisanego dzialu - scenariusz crash (pkt 3)
        self.manager_nodept = User.objects.create_user(
            username="manager_nodept",
            email="manager_nodept@example.com",
            password="password123",
        )
        self.manager_nodept.profile.role = "MANAGER"
        self.manager_nodept.profile.department = None
        self.manager_nodept.profile.save()

        self.employee = User.objects.create_user(
            username="employee_doc",
            email="employee_doc@example.com",
            password="password123",
        )
        self.employee.profile.role = "EMPLOYEE"
        self.employee.profile.department = self.dept_it
        self.employee.profile.save()

    def test_manager_without_department_gets_403_not_crash(self):
        # T-CRASH-01: Manager bez dzialu nie moze dodac dokumentu - zwraca 403, nie crash
        self.client.force_authenticate(user=self.manager_nodept)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Test bezdzialowy",
                "department": self.dept_it.id,
                "confidentiality_level": "PUBLIC",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)

    def test_manager_cannot_create_document_in_other_department(self):
        # Manager IT nie moze dodac dokumentu do dzialu HR
        self.client.force_authenticate(user=self.manager_it)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Dokument HR od IT managera",
                "department": self.dept_hr.id,
                "confidentiality_level": "INTERNAL",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_create_document_in_own_department(self):
        # Manager IT moze dodac dokument do swojego dzialu
        self.client.force_authenticate(user=self.manager_it)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Dokument IT od managera IT",
                "department": self.dept_it.id,
                "confidentiality_level": "INTERNAL",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_manager_cannot_create_secret_document(self):
        # Manager nie moze ustawic poziomu SECRET - tylko Admin
        self.client.force_authenticate(user=self.manager_it)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Tajny dokument",
                "department": self.dept_it.id,
                "confidentiality_level": "SECRET",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_cannot_create_document(self):
        # Pracownik nie moze dodawac dokumentow
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Dokument pracownika",
                "department": self.dept_it.id,
                "confidentiality_level": "PUBLIC",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_secret_document(self):
        # Admin moze ustawic poziom SECRET i dowolny dzial
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Tajny dokument admina",
                "department": self.dept_hr.id,
                "confidentiality_level": "SECRET",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_cannot_access_secret_document(self):
        # Pracownik bez allowed_users nie ma dostepu do SECRET
        secret_doc = Document.objects.create(
            title="Tajne",
            department=self.dept_it,
            confidentiality_level="SECRET",
        )
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(f"/api/documents/{secret_doc.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_with_allowed_users_can_access_secret(self):
        # Pracownik wpisany na liste allowed_users ma dostep do SECRET
        secret_doc = Document.objects.create(
            title="Tajne dla wybranych",
            department=self.dept_it,
            confidentiality_level="SECRET",
        )
        secret_doc.allowed_users.add(self.employee)
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(f"/api/documents/{secret_doc.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
