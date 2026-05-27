# API CONTRACT

Endpointy udostępniane przez aplikację backendową do obsługi komunikacji z frontendem.

## Autoryzacja i Użytkownik

### `POST /api/auth/login/`
- **Opis:** Logowanie do aplikacji. Zwraca tokeny autoryzacyjne lub flagę MFA.
- **Wymagane uprawnienia:** Publiczne
- **Request:**
```json
{
  "username": "email@example.com",
  "password": "secretpassword"
}
```
- **Response (200 OK, MFA wyłączone):** Zwraca JWT Access oraz Refresh token.
```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "mfa_required": false,
  "temp_token": ""
}
```
- **Response (200 OK, MFA włączone):** Zwraca `mfa_required` oraz `temp_token` do kroku 2.
```json
{
  "mfa_required": true,
  "temp_token": "<jwt>"
}
```

### `POST /api/auth/verify-totp/`
- **Opis:** Weryfikacja kodu TOTP i wydanie finalnych tokenów JWT.
- **Wymagane uprawnienia:** Publiczne
- **Request:**
```json
{
  "token": "123456",
  "temp_token": "<jwt>"
}
```
- **Response (200 OK):**
```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "mfa_required": false
}
```

### `POST /api/auth/mfa/enable/`
- **Opis:** Aktywuje MFA i zwraca sekret TOTP oraz kody zapasowe.
- **Wymagane uprawnienia:** Zalogowany
- **Response (200 OK):**
```json
{
  "totp_secret": "<secret>",
  "backup_codes": ["CODE1", "CODE2", "CODE3", "CODE4", "CODE5"],
  "mfa_enabled": true
}
```

### `POST /api/auth/mfa/disable/`
- **Opis:** Wyłącza MFA dla konta.
- **Wymagane uprawnienia:** Zalogowany
- **Response (200 OK):**
```json
{
  "mfa_enabled": false
}
```

### `GET /api/me/`
- **Opis:** Zwraca informacje o obecnie zalogowanym użytkowniku.
- **Wymagane uprawnienia:** Zalogowany
- **Response (200 OK):**
 ```json
 {
  "id": 1,
  "username": "admin@example.com",
  "email": "admin@example.com",
  "profile": {
    "role": "ADMIN",
    "department": 1,
    "department_name": "Zarząd",
    "mfa_enabled": true
  }
 }
 ```

## Działy (Departments)

### `GET /api/departments/`
- **Opis:** Zwraca listę działów organizacyjnych.
- **Wymagane uprawnienia:** Zalogowany

## Dokumenty (Documents)

### `GET /api/documents/`
- **Opis:** Zwraca listę dokumentów. Zwracane elementy są odfiltrowane w taki sposób, aby użytkownik otrzymał tylko to, do czego ma prawo dostępu.
- **Wymagane uprawnienia:** Zalogowany
- **Response (200 OK):** Array of objects reprezentujących dokumenty.

### `POST /api/documents/`
- **Opis:** Utworzenie nowego dokumentu.
- **Wymagane uprawnienia:** ADMIN lub MANAGER.

### `GET /api/documents/{id}/`
- **Opis:** Pobiera szczegóły pojedynczego dokumentu. Waliduje w tle czy użytkownik może go zobaczyć.
- **Wymagane uprawnienia:** Zalogowany + odpowiednie prawa (RBAC). W przeciwnym razie `403 Forbidden`.

### `PUT /api/documents/{id}/`
- **Opis:** Aktualizacja dokumentu (metadanych lub samego pliku).
- **Wymagane uprawnienia:** ADMIN lub MANAGER działu przypisanego do dokumentu.

### `DELETE /api/documents/{id}/`
- **Opis:** Całkowite usunięcie dokumentu.
- **Wymagane uprawnienia:** ADMIN.

## Audyt

### `GET /api/audit-logs/`
- **Opis:** Pobranie historii operacji wykonanych w systemie, zawierających również te zablokowane ze statusem `ACCESS_DENIED`.
- **Wymagane uprawnienia:** ADMIN lub AUDITOR.

## Diagnostyka systemu

### `GET /api/diagnostics/`
- **Opis:** Zwraca bieżące parametry diagnostyczne dla kokpitu (poziom zagrożeń, liczba odmów, stan audytu).
- **Wymagane uprawnienia:** Zalogowany
- **Response (200 OK):**
```json
{
  "service_status": "ONLINE",
  "encryption_standard": "AES-256-GCM",
  "audit_hashing_enabled": true,
  "threat_level": "LOW",
  "denied_last_24h": 0,
  "total_logs": 120,
  "last_event_at": "2026-05-27T18:21:30.000Z",
  "rbac_db_engine": "django.db.backends.sqlite3"
}
```
