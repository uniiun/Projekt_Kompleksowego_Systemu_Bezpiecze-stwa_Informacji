# ruff: noqa: E402
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from documents.models import Department, Document

# Departments
hr, _ = Department.objects.get_or_create(
    name="HR", description="Dział Zasobów Ludzkich"
)
it, _ = Department.objects.get_or_create(
    name="IT", description="Dział Technologii Informacyjnych"
)
fin, _ = Department.objects.get_or_create(
    name="Finanse", description="Dział Finansów i Księgowości"
)
zarzad, _ = Department.objects.get_or_create(name="Zarząd", description="Zarząd Spółki")
audyt, _ = Department.objects.get_or_create(
    name="Audyt", description="Dział Audytu Wewnętrznego"
)

# Users
users_data = [
    ("admin@example.com", "admin123", "ADMIN", zarzad),
    ("manager.it@example.com", "manager123", "MANAGER", it),
    ("employee.it@example.com", "emp123", "EMPLOYEE", it),
    ("employee.hr@example.com", "emp123", "EMPLOYEE", hr),
    ("auditor@example.com", "audyt123", "AUDITOR", audyt),
]

for email, password, role, dept in users_data:
    username = email.split("@")[0]
    user, created = User.objects.get_or_create(username=email, email=email)
    if created:
        user.set_password(password)
        user.save()
    profile = user.profile
    profile.role = role
    profile.department = dept
    profile.save()

admin_user = User.objects.get(username="admin@example.com")
it_manager = User.objects.get(username="manager.it@example.com")

# Documents
docs_data = [
    (
        "Polityka bezpieczeństwa IT",
        "Dokument opisujący zasady bezpieczeństwa.",
        it,
        "INTERNAL",
        it_manager,
    ),
    ("Raport finansowy Q1", "Zestawienie za Q1.", fin, "CONFIDENTIAL", admin_user),
    (
        "Lista pracowników",
        "Spis wszystkich pracowników.",
        hr,
        "CONFIDENTIAL",
        admin_user,
    ),
    (
        "Strategia zarządu",
        "Główny dokument planistyczny.",
        zarzad,
        "SECRET",
        admin_user,
    ),
    (
        "Regulamin pracy",
        "Zasady i przepisy ogólne dla każdego pracownika.",
        hr,
        "PUBLIC",
        admin_user,
    ),
]

for title, desc, dept, conf, creator in docs_data:
    Document.objects.get_or_create(
        title=title,
        defaults={
            "description": desc,
            "department": dept,
            "confidentiality_level": conf,
            "created_by": creator,
        },
    )

print("Fixtures created successfully.")
