import pyotp
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


class MFAViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="mfa_view",
            email="mfa_view@example.com",
            password="password123",
        )

    def test_enable_mfa_endpoint_returns_secret_and_codes(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/auth/mfa/enable/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("totp_secret"))
        self.assertTrue(response.data.get("mfa_enabled"))
        self.assertEqual(len(response.data.get("backup_codes", [])), 5)

    def test_disable_mfa_endpoint_clears_fields(self):
        self.user.profile.mfa_enabled = True
        self.user.profile.totp_secret = "TESTSECRET"
        self.user.profile.mfa_backup_codes = "CODE1,CODE2"
        self.user.profile.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/auth/mfa/disable/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertFalse(self.user.profile.mfa_enabled)
        self.assertEqual(self.user.profile.totp_secret, "")
        self.assertEqual(self.user.profile.mfa_backup_codes, "")

    def test_verify_mfa_flow_returns_tokens(self):
        secret = pyotp.random_base32()
        self.user.profile.mfa_enabled = True
        self.user.profile.totp_secret = secret
        self.user.profile.save()

        token = pyotp.TOTP(secret).now()
        temp_token = str(RefreshToken.for_user(self.user))

        response = self.client.post(
            "/api/auth/verify-totp/",
            {"token": token, "temp_token": temp_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("access"))
        self.assertTrue(response.data.get("refresh"))
        self.assertFalse(response.data.get("mfa_required"))

    def test_login_returns_mfa_required_and_temp_token(self):
        self.user.profile.mfa_enabled = True
        self.user.profile.totp_secret = pyotp.random_base32()
        self.user.profile.save()

        response = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("mfa_required"))
        self.assertTrue(response.data.get("temp_token"))
        self.assertIsNone(response.data.get("access"))

    def test_login_returns_access_when_mfa_disabled(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get("mfa_required"))
        self.assertTrue(response.data.get("access"))
