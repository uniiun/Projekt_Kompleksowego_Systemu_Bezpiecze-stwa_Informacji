# IAM Lifecycle

## Onboarding
- ADMIN tworzy konto przez `POST /api/users/`.
- Domyslna rola to `EMPLOYEE`, jesli nie zostanie podana.
- Polityka hasel jest egzekwowana przez walidatory Django.

## Zmiana roli i dzialu
- ADMIN moze aktualizowac role i dzial przez `PATCH /api/users/{id}/`.
- Zmiana jest logowana w audycie jako `USER_ROLE_CHANGE` oraz `USER_DEPARTMENT_CHANGE`.

## Offboarding (dezaktywacja)
- ADMIN wykonuje `POST /api/users/{id}/deactivate/`.
- Nie mozna zdezaktywowac ostatniego administratora.
- Nie mozna zdezaktywowac wlasnego konta.

## Reaktywacja
- ADMIN wykonuje `POST /api/users/{id}/activate/`.

## Reset MFA
- ADMIN wykonuje `POST /api/users/{id}/reset-mfa/`.
- Usuwane sa sekrety TOTP, kody zapasowe i poswiadczenia WebAuthn.

## Audyt IAM
- Logowane akcje: `USER_CREATE`, `USER_ROLE_CHANGE`, `USER_DEPARTMENT_CHANGE`,
  `USER_ACTIVATE`, `USER_DEACTIVATE`, `USER_RESET_MFA`.
