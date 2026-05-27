from django.contrib.auth.models import User
from django.test import TestCase
from documents.models import Department, Document
from documents.permissions import IsAuthorizedForDocument
from rest_framework.test import APIRequestFactory


class DocumentPermissionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.dept_it = Department.objects.create(name="IT")
        self.dept_hr = Department.objects.create(name="HR")

        self.employee = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="password123",
        )
        self.employee.profile.role = "EMPLOYEE"
        self.employee.profile.department = self.dept_it
        self.employee.profile.save()

        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="password123",
        )
        self.manager.profile.role = "MANAGER"
        self.manager.profile.department = self.dept_it
        self.manager.profile.save()

        self.secret_doc = Document.objects.create(
            title="Secret",
            department=self.dept_it,
            confidentiality_level="SECRET",
        )

        self.it_doc = Document.objects.create(
            title="IT Internal",
            department=self.dept_it,
            confidentiality_level="INTERNAL",
        )

    def test_employee_cannot_delete_document(self):
        request = self.factory.delete("/api/documents/1/")
        request.user = self.employee

        permission = IsAuthorizedForDocument()
        self.assertFalse(permission.has_object_permission(request, None, self.it_doc))

    def test_manager_can_edit_own_department(self):
        request = self.factory.patch("/api/documents/1/")
        request.user = self.manager

        permission = IsAuthorizedForDocument()
        self.assertTrue(permission.has_object_permission(request, None, self.it_doc))

    def test_secret_requires_allowed_user(self):
        request = self.factory.get("/api/documents/1/")
        request.user = self.employee

        permission = IsAuthorizedForDocument()
        self.assertFalse(
            permission.has_object_permission(request, None, self.secret_doc)
        )

        self.secret_doc.allowed_users.add(self.employee)
        self.assertTrue(
            permission.has_object_permission(request, None, self.secret_doc)
        )
