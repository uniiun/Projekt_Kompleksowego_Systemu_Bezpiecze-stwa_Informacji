import hashlib
import hmac

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from documents.models import Document


class AccessLog(models.Model):
    ACTION_CHOICES = [
        ("LOGIN", "Logowanie"),
        ("VIEW_LIST", "Pobranie listy dokumentów"),
        ("VIEW_DOCUMENT", "Wyświetlenie dokumentu"),
        ("DOWNLOAD_DOCUMENT", "Pobranie dokumentu"),
        ("CREATE_DOCUMENT", "Dodanie dokumentu"),
        ("UPDATE_DOCUMENT", "Edycja dokumentu"),
        ("DELETE_DOCUMENT", "Usunięcie dokumentu"),
        ("ACCESS_DENIED", "Odmowa dostępu"),
        ("USER_CREATE", "Utworzenie użytkownika"),
        ("USER_ROLE_CHANGE", "Zmiana roli użytkownika"),
        ("USER_DEPARTMENT_CHANGE", "Zmiana działu użytkownika"),
        ("USER_ACTIVATE", "Aktywacja użytkownika"),
        ("USER_DEACTIVATE", "Dezaktywacja użytkownika"),
        ("USER_RESET_MFA", "Reset MFA użytkownika"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="access_logs",
    )
    document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="access_logs",
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    success = models.BooleanField(default=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    message = models.TextField(blank=True, null=True)
    prev_hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    entry_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{username} - {self.action} - {'SUCCESS' if self.success else 'DENIED'}"

    def build_hash_payload(self, prev_hash):
        created_at = self.created_at.isoformat() if self.created_at else ""
        user_id = self.user_id or ""
        document_id = self.document_id or ""
        ip_address = self.ip_address or ""
        message = self.message or ""

        return "|".join(
            [
                str(prev_hash or ""),
                str(user_id),
                str(document_id),
                self.action,
                str(int(self.success)),
                ip_address,
                message,
                created_at,
            ]
        )

    def calculate_entry_hash(self, prev_hash):
        secret = str(
            getattr(settings, "AUDIT_HASH_SECRET", settings.SECRET_KEY)
        ).encode("utf-8")
        payload = self.build_hash_payload(prev_hash).encode("utf-8")
        return hmac.new(secret, payload, hashlib.sha256).hexdigest()
