from django.contrib.auth.models import User
from django.test import TestCase
from documents.models import Department
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import WebAuthnCredential


class UserManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(name="IT")

        self.admin = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
        )
        self.admin.profile.role = "ADMIN"
        self.admin.profile.save()

        self.employee = User.objects.create_user(
            username="employee_user",
            email="employee@example.com",
            password="password123",
        )
        self.employee.profile.role = "EMPLOYEE"
        self.employee.profile.department = self.department
        self.employee.profile.save()

    def test_admin_can_create_user(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/users/",
            {
                "username": "new_user",
                "email": "new_user@example.com",
                "password": "StrongPass123!",
                "role": "MANAGER",
                "department": self.department.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = User.objects.get(username="new_user")
        self.assertEqual(created.profile.role, "MANAGER")
        self.assertEqual(created.profile.department, self.department)

    def test_non_admin_cannot_create_user(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(
            "/api/users/",
            {
                "username": "blocked_user",
                "email": "blocked@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_deactivate_and_activate_user(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/users/{self.employee.id}/deactivate/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_active)

        response = self.client.post(f"/api/users/{self.employee.id}/activate/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.refresh_from_db()
        self.assertTrue(self.employee.is_active)

    def test_cannot_deactivate_last_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/users/{self.admin.id}/deactivate/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_reset_mfa(self):
        self.employee.profile.mfa_enabled = True
        self.employee.profile.totp_secret = "TESTSECRET"
        self.employee.profile.mfa_backup_codes = "CODE1,CODE2"
        self.employee.profile.webauthn_enabled = True
        self.employee.profile.save()

        WebAuthnCredential.objects.create(
            user=self.employee,
            credential_id="cred1",
            public_key="pubkey",
            sign_count=0,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/users/{self.employee.id}/reset-mfa/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employee.profile.refresh_from_db()
        self.assertFalse(self.employee.profile.mfa_enabled)
        self.assertEqual(self.employee.profile.totp_secret, "")
        self.assertEqual(self.employee.profile.mfa_backup_codes, "")
        self.assertFalse(self.employee.profile.webauthn_enabled)
        self.assertFalse(
            WebAuthnCredential.objects.filter(user=self.employee).exists()
        )

