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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"{username} - {self.action} - {'SUCCESS' if self.success else 'DENIED'}"
