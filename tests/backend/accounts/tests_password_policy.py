# Testy polityki hasel: wygasniecie co 30 dni i zmiana hasla
from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from documents.models import Department
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


class PasswordExpiryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name="Testy")

        self.user = User.objects.create_user(
            username="expiry_user",
            email="expiry@example.com",
            password="OldPass123!",
        )
        self.user.profile.role = "EMPLOYEE"
        self.user.profile.department = self.dept
        self.user.profile.save()

    def test_fresh_password_allows_access(self):
        # Haslo dopiero co zmienione - dostep powinien byc mozliwy
        self.user.profile.password_changed_at = timezone.now()
        self.user.profile.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_expired_password_blocks_access(self):
        # Haslo zmienione ponad 30 dni temu - middleware powinien blokowac dostep
        # Uwaga: force_authenticate omija middleware Django, dlatego uzywamy prawdziwego JWT
        self.user.profile.password_changed_at = timezone.now() - timedelta(days=31)
        self.user.profile.save()
        token = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        data = response.json()
        self.assertEqual(data.get("code"), "PASSWORD_EXPIRED")

    def test_expired_password_allows_change_password_endpoint(self):
        # Endpoint zmiany hasla musi byc dostepny nawet gdy haslo wygaslo
        self.user.profile.password_changed_at = timezone.now() - timedelta(days=31)
        self.user.profile.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {"old_password": "OldPass123!", "new_password": "NewPass456!"},
            format="json",
        )
        # Powinien byc dostepny - nie blokowany przez PasswordExpiryMiddleware
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_expired_password_allows_me_endpoint(self):
        # /api/me/ musi byc dostepny gdy haslo wygaslo (frontend potrzebuje danych profilu)
        self.user.profile.password_changed_at = timezone.now() - timedelta(days=31)
        self.user.profile.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_change_resets_expiry_timer(self):
        # Po zmianie hasla data password_changed_at powinna byc zaktualizowana
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {"old_password": "OldPass123!", "new_password": "FreshPass789@"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        days_since = (timezone.now() - self.user.profile.password_changed_at).days
        self.assertEqual(days_since, 0)

    def test_profile_serializer_password_expired_field(self):
        # Pole password_expired w serializatorze profilu zwraca True dla przeterminiowanego hasla
        self.user.profile.password_changed_at = timezone.now() - timedelta(days=31)
        self.user.profile.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["profile"]["password_expired"])

    def test_profile_serializer_password_not_expired_field(self):
        # Pole password_expired zwraca False gdy haslo jest aktualne
        self.user.profile.password_changed_at = timezone.now()
        self.user.profile.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/me/")
        self.assertFalse(response.data["profile"]["password_expired"])
