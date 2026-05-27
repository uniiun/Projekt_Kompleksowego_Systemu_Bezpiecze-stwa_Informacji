from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Department, Document


class RBACPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Departments
        self.dept_it = Department.objects.create(name="IT")
        self.dept_hr = Department.objects.create(name="HR")

        # Create Users with different roles
        self.admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="password123"
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
            username="auditor", email="auditor@example.com", password="password123"
        )
        self.auditor.profile.role = "AUDITOR"
        self.auditor.profile.save()

        # Create Documents
        self.doc_public = Document.objects.create(
            title="Public Document",
            department=self.dept_it,
            confidentiality_level="PUBLIC",
        )
        self.doc_it_internal = Document.objects.create(
            title="IT Internal",
            department=self.dept_it,
            confidentiality_level="INTERNAL",
        )
        self.doc_it_confidential = Document.objects.create(
            title="IT Confidential",
            department=self.dept_it,
            confidentiality_level="CONFIDENTIAL",
        )
        self.doc_hr_internal = Document.objects.create(
            title="HR Internal",
            department=self.dept_hr,
            confidentiality_level="INTERNAL",
        )
        self.doc_secret = Document.objects.create(
            title="Secret Document",
            department=self.dept_it,
            confidentiality_level="SECRET",
        )

    def login(self, user):
        self.client.force_authenticate(user=user)

    def test_admin_sees_all_documents(self):
        self.login(self.admin)
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see all 5 documents
        self.assertEqual(len(response.data), 5)

    def test_employee_sees_only_allowed_documents(self):
        self.login(self.employee_it)
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Employee IT should see: Public, IT Internal.
        # (They don't see IT Confidential by default in list, unless allowed_users)
        titles = [d["title"] for d in response.data]
        self.assertIn("Public Document", titles)
        self.assertIn("IT Internal", titles)
        self.assertNotIn("HR Internal", titles)
        self.assertNotIn("IT Confidential", titles)
        self.assertNotIn("Secret Document", titles)

    def test_employee_forbidden_from_other_department(self):
        self.login(self.employee_it)
        response = self.client.get(f"/api/documents/{self.doc_hr_internal.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_edit_own_department_not_others(self):
        self.login(self.manager_it)

        # Can edit own department internal doc
        response = self.client.patch(
            f"/api/documents/{self.doc_it_internal.id}/",
            {"title": "Updated IT Internal"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Cannot edit other department doc
        response = self.client.patch(
            f"/api/documents/{self.doc_hr_internal.id}/", {"title": "Malicious Update"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_auditor_view_only(self):
        self.login(self.auditor)

        # Auditor can see IT internal
        response = self.client.get(f"/api/documents/{self.doc_it_internal.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Auditor cannot edit
        response = self.client.patch(
            f"/api/documents/{self.doc_it_internal.id}/", {"title": "Auditor Update"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Auditor cannot delete
        response = self.client.delete(f"/api/documents/{self.doc_it_internal.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_secret_document_access(self):
        # Admin can see secret by default in get_queryset (but IsAuthorizedForDocument checks has_object_permission)
        # Actually in views.py: role == "ADMIN" returns queryset (all).
        # In permissions.py: if role == "ADMIN": return True.
        self.login(self.admin)
        response = self.client.get(f"/api/documents/{self.doc_secret.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Manager IT cannot see secret unless in allowed_users
        self.login(self.manager_it)
        response = self.client.get(f"/api/documents/{self.doc_secret.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Allow Manager IT
        self.doc_secret.allowed_users.add(self.manager_it)
        response = self.client.get(f"/api/documents/{self.doc_secret.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
