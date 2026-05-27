from datetime import timedelta

from audit.models import AccessLog
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient


class SystemDiagnosticsViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="diag_user", password="pass12345")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.url = reverse("system_diagnostics")

    def test_returns_low_threat_without_denied_events(self):
        first = AccessLog.objects.create(user=self.user, action="LOGIN", success=True)
        first.prev_hash = ""
        first.entry_hash = first.calculate_entry_hash("")
        first.save(update_fields=["prev_hash", "entry_hash"])

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["threat_level"], "LOW")
        self.assertEqual(response.data["denied_last_24h"], 0)
        self.assertEqual(response.data["recent_audit_events_24h"], 1)
        self.assertTrue(response.data["audit_pipeline_active"])
        self.assertTrue(response.data["audit_hashing_enabled"])
        self.assertTrue(response.data["audit_chain_valid"])
        self.assertTrue(response.data["audit_integrity_ok"])

    def test_returns_elevated_threat_when_denied_events_reach_threshold(self):
        now = timezone.now()

        for i in range(5):
            event = AccessLog.objects.create(
                user=self.user,
                action="ACCESS_DENIED",
                success=False,
                message=f"Denied #{i}",
            )
            AccessLog.objects.filter(pk=event.pk).update(
                created_at=now - timedelta(hours=2)
            )
            event.refresh_from_db()
            previous = (
                AccessLog.objects.exclude(pk=event.pk)
                .order_by("created_at", "id")
                .last()
            )
            prev_hash = previous.entry_hash if previous else ""
            event.prev_hash = prev_hash
            event.entry_hash = event.calculate_entry_hash(prev_hash)
            event.save(update_fields=["prev_hash", "entry_hash"])

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["threat_level"], "ELEVATED")
        self.assertEqual(response.data["denied_last_24h"], 5)
        self.assertEqual(response.data["denied_last_1h"], 0)

    def test_returns_high_threat_and_last_incident_for_recent_spike(self):
        now = timezone.now()
        incident = None

        for i in range(5):
            incident = AccessLog.objects.create(
                user=self.user,
                action="ACCESS_DENIED",
                success=False,
                message=f"Recent denied #{i}",
            )
            AccessLog.objects.filter(pk=incident.pk).update(
                created_at=now - timedelta(minutes=10)
            )
            incident.refresh_from_db()
            previous = (
                AccessLog.objects.exclude(pk=incident.pk)
                .order_by("created_at", "id")
                .last()
            )
            prev_hash = previous.entry_hash if previous else ""
            incident.prev_hash = prev_hash
            incident.entry_hash = incident.calculate_entry_hash(prev_hash)
            incident.save(update_fields=["prev_hash", "entry_hash"])

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["threat_level"], "HIGH")
        self.assertEqual(response.data["denied_last_1h"], 5)
        self.assertIsNotNone(response.data["last_incident_at"])
        self.assertEqual(
            response.data["last_event_at"], response.data["last_incident_at"]
        )

    def test_reports_broken_audit_chain_when_entry_is_tampered(self):
        event = AccessLog.objects.create(
            user=self.user,
            action="VIEW_LIST",
            success=True,
            message="Initial event",
        )
        event.prev_hash = ""
        event.entry_hash = event.calculate_entry_hash("")
        event.save(update_fields=["prev_hash", "entry_hash"])

        event.message = "Tampered event"
        event.save(update_fields=["message"])

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["audit_chain_valid"])
        self.assertFalse(response.data["audit_integrity_ok"])
