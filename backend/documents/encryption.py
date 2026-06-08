import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings


# Tworzenie klucza Fernet z Django SECRET_KEY przy uzyciu SHA256 + base64url
def _get_fernet_key():
    raw = settings.SECRET_KEY.encode("utf-8")
    digest = hashlib.sha256(raw).digest()
    return base64.urlsafe_b64encode(digest)


def get_fernet():
    return Fernet(_get_fernet_key())


def encrypt_bytes(data: bytes) -> bytes:
    return get_fernet().encrypt(data)


def decrypt_bytes(data: bytes) -> bytes:
    return get_fernet().decrypt(data)
