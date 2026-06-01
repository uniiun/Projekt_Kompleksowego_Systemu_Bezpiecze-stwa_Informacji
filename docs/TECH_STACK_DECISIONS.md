# Uzasadnienie doboru technologii

## Backend
- Django + DRF: szybkie tworzenie API, wbudowane mechanizmy auth.
- SimpleJWT: stabilne tokeny dla API.

## Frontend
- React + Vite: szybki build i prostota UI.

## MFA
- TOTP: powszechna, lekka metoda.
- WebAuthn (Windows Hello - odcisk palca): wysoki poziom bezpieczenstwa.

## Baza danych
- SQLite w MVP, mozliwosc migracji na Postgres.
