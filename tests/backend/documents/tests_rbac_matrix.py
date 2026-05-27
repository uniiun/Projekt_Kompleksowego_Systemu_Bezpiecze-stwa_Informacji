from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from documents.models import Department, Document


class RBACMatrixTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept_it = Department.objects.create(name="IT")
        self.dept_hr = Department.objects.create(name="HR")

        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password123",
        )
        self.admin.profile.role = "ADMIN"
        self.admin.profile.save()

        self.manager_it = User.objects.create_user(
            username="manager_it",
            email="manager.it@example.com",
            password="password123",
        )
        self.manager_it.profile.role = "MANAGER"
        self.manager_it.profile.department = self.dept_it
        self.manager_it.profile.save()

        self.employee_it = User.objects.create_user(
            username="employee_it",
            email="employee.it@example.com",
            password="password123",
        )
        self.employee_it.profile.role = "EMPLOYEE"
        self.employee_it.profile.department = self.dept_it
        self.employee_it.profile.save()

        self.auditor = User.objects.create_user(
            username="auditor",
            email="auditor@example.com",
            password="password123",
        )
        self.auditor.profile.role = "AUDITOR"
        self.auditor.profile.save()

        self.doc_public_it = Document.objects.create(
            title="Public IT",
            department=self.dept_it,
            confidentiality_level="PUBLIC",
        )
        self.doc_internal_it = Document.objects.create(
            title="Internal IT",
            department=self.dept_it,
            confidentiality_level="INTERNAL",
        )
        self.doc_confidential_it = Document.objects.create(
            title="Confidential IT",
            department=self.dept_it,
            confidentiality_level="CONFIDENTIAL",
        )
        self.doc_internal_hr = Document.objects.create(
            title="Internal HR",
            department=self.dept_hr,
            confidentiality_level="INTERNAL",
        )
        self.doc_secret_it = Document.objects.create(
            title="Secret IT",
            department=self.dept_it,
            confidentiality_level="SECRET",
        )

    def login(self, user):
        self.client.force_authenticate(user=user)

    def test_admin_list_sees_all(self):
        self.login(self.admin)
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)

    def test_manager_list_sees_department_and_public(self):
        self.login(self.manager_it)
        response = self.client.get("/api/documents/")
        titles = {doc["title"] for doc in response.data}
        self.assertIn(self.doc_public_it.title, titles)
        self.assertIn(self.doc_internal_it.title, titles)
        self.assertIn(self.doc_confidential_it.title, titles)
        self.assertNotIn(self.doc_internal_hr.title, titles)
        self.assertNotIn(self.doc_secret_it.title, titles)

    def test_employee_list_sees_public_and_internal_same_dept(self):
        self.login(self.employee_it)
        response = self.client.get("/api/documents/")
        titles = {doc["title"] for doc in response.data}
        self.assertIn(self.doc_public_it.title, titles)
        self.assertIn(self.doc_internal_it.title, titles)
        self.assertNotIn(self.doc_confidential_it.title, titles)
        self.assertNotIn(self.doc_internal_hr.title, titles)
        self.assertNotIn(self.doc_secret_it.title, titles)

    def test_auditor_list_sees_public_and_internal(self):
        self.login(self.auditor)
        response = self.client.get("/api/documents/")
        titles = {doc["title"] for doc in response.data}
        self.assertIn(self.doc_public_it.title, titles)
        self.assertIn(self.doc_internal_it.title, titles)
        self.assertNotIn(self.doc_confidential_it.title, titles)
        self.assertNotIn(self.doc_secret_it.title, titles)

    def test_employee_cannot_access_other_department_detail(self):
        self.login(self.employee_it)
        response = self.client.get(f"/api/documents/{self.doc_internal_hr.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_cannot_delete_documents(self):
        self.login(self.manager_it)
        response = self.client.delete(f"/api/documents/{self.doc_internal_it.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_auditor_cannot_create_document(self):
        self.login(self.auditor)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Audit Doc",
                "department": self.dept_it.id,
                "confidentiality_level": "PUBLIC",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_secret(self):
        self.login(self.admin)
        response = self.client.get(f"/api/documents/{self.doc_secret_it.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manager_can_access_secret_when_allowed(self):
        self.doc_secret_it.allowed_users.add(self.manager_it)
        self.login(self.manager_it)
        response = self.client.get(f"/api/documents/{self.doc_secret_it.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_edit_document(self):
        self.login(self.employee_it)
        response = self.client.patch(
            f"/api/documents/{self.doc_internal_it.id}/",
            {"title": "Hack"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

