# API CONTRACT

Endpointy udostępniane przez aplikację backendową do obsługi komunikacji z frontendem.

## Autoryzacja i Użytkownik

### `POST /api/auth/login/`
- **Opis:** Logowanie do aplikacji. Zwraca tokeny autoryzacyjne.
- **Wymagane uprawnienia:** Publiczne
- **Request:**
```json
{
  "username": "email@example.com",
  "password": "secretpassword"
}
```
- **Response (200 OK):** Zwraca JWT Access oraz Refresh token.

### `GET /api/me/`
- **Opis:** Zwraca informacje o obecnie zalogowanym użytkowniku.
- **Wymagane uprawnienia:** Zalogowany
- **Response (200 OK):**
```json
{
  "id": 1,
  "email": "admin@example.com",
  "role": "ADMIN",
  "department": 1,
  "department_name": "Zarząd"
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
