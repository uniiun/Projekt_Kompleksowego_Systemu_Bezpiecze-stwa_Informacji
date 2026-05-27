from audit.models import AccessLog
from django.contrib.auth.models import User
from django.test import TestCase
from documents.models import Department, Document
from rest_framework import status
from rest_framework.test import APIClient


class AuditMiddlewareTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept_it = Department.objects.create(name="IT")
        self.dept_hr = Department.objects.create(name="HR")

        self.employee = User.objects.create_user(
            username="employee_it",
            email="employee.it@example.com",
            password="password123",
        )
        self.employee.profile.role = "EMPLOYEE"
        self.employee.profile.department = self.dept_it
        self.employee.profile.save()

        self.manager = User.objects.create_user(
            username="manager_it",
            email="manager.it@example.com",
            password="password123",
        )
        self.manager.profile.role = "MANAGER"
        self.manager.profile.department = self.dept_it
        self.manager.profile.save()

        self.hr_doc = Document.objects.create(
            title="HR Internal",
            department=self.dept_hr,
            confidentiality_level="INTERNAL",
        )

    def test_access_denied_creates_access_log(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(f"/api/documents/{self.hr_doc.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(
            AccessLog.objects.filter(
                user=self.employee,
                action="ACCESS_DENIED",
                document=self.hr_doc,
            ).exists()
        )

    def test_manager_cannot_access_audit_logs(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get("/api/audit-logs/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
