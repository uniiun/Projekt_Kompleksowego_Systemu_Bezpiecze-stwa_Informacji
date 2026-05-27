from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    ROLE_CHOICES = [
        ("ADMIN", "Administrator"),
        ("MANAGER", "Menedżer"),
        ("EMPLOYEE", "Pracownik"),
        ("AUDITOR", "Audytor"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="EMPLOYEE")
    department = models.ForeignKey(
        "documents.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="profiles",
    )
    # Pola MFA
    mfa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=32, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    # Włączenie MFA oraz generowanie sekretu
    def enable_mfa(self):
        # Włącza MFA, generuje sekret jeżeli go brak
        import pyotp

        if not self.totp_secret:
            self.totp_secret = pyotp.random_base32()
        self.mfa_enabled = True
        self.save()
        return self.totp_secret

    # Weryfikacja podanego tokenu OTP
    def verify_otp(self, token):
        if not self.totp_secret:
            return False
        import pyotp

        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(token)


# Signal to create profile automatically when user is created


@receiver(post_save, sender=User)
def create_user_profile(_sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(_sender, instance, **kwargs):
    instance.profile.save()
