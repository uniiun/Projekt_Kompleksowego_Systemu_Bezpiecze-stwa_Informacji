import pyotp
from django.contrib.auth.models import User
from django.test import TestCase


class ProfileModelTests(TestCase):
    def test_profile_created_on_user_creation(self):
        user = User.objects.create_user(
            username="basic_user",
            email="basic@example.com",
            password="password123",
        )
        self.assertIsNotNone(user.profile)
        self.assertEqual(user.profile.role, "EMPLOYEE")

    def test_enable_mfa_generates_secret_and_codes(self):
        user = User.objects.create_user(
            username="mfa_user",
            email="mfa@example.com",
            password="password123",
        )
        secret, codes = user.profile.enable_mfa()

        self.assertTrue(user.profile.mfa_enabled)
        self.assertTrue(secret)
        self.assertEqual(len(codes), 6)
        self.assertTrue(all(len(code) == 8 for code in codes))

    def test_verify_otp_consumes_backup_code(self):
        user = User.objects.create_user(
            username="backup_user",
            email="backup@example.com",
            password="password123",
        )
        user.profile.mfa_enabled = True
        user.profile.mfa_backup_codes = "ABC12345,XYZ98765"
        user.profile.totp_secret = pyotp.random_base32()
        user.profile.save()

        self.assertTrue(user.profile.verify_otp("ABC12345"))
        user.profile.refresh_from_db()
        self.assertNotIn("ABC12345", user.profile.mfa_backup_codes)
