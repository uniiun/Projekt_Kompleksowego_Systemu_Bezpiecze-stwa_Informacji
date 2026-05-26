from django.db import models
from django.contrib.auth.models import User

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Document(models.Model):
    CONFIDENTIALITY_CHOICES = [
        ('PUBLIC', 'Publiczny'),
        ('INTERNAL', 'Wewnętrzny'),
        ('CONFIDENTIAL', 'Poufny'),
        ('SECRET', 'Tajny'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='documents/', blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='documents')
    confidentiality_level = models.CharField(max_length=20, choices=CONFIDENTIALITY_CHOICES, default='INTERNAL')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_documents')
    allowed_users = models.ManyToManyField(User, blank=True, related_name='allowed_documents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
