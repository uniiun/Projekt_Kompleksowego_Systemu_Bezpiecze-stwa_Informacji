import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_profile_mfa_backup_codes"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="webauthn_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="WebAuthnCredential",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("credential_id", models.CharField(max_length=255, unique=True)),
                ("public_key", models.TextField()),
                ("sign_count", models.PositiveIntegerField(default=0)),
                ("transports", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="webauthn_credentials",
                        to="auth.user",
                    ),
                ),
            ],
        ),
    ]
