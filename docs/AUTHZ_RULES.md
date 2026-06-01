# Reguly autoryzacji

## Podstawowe reguly
- ADMIN: pelny dostep do dokumentow i logow.
- MANAGER: dostep do dokumentow wlasnego dzialu, brak dostepu do logow.
- EMPLOYEE: odczyt dokumentow PUBLIC/INTERNAL z wlasnego dzialu.
- AUDITOR: odczyt PUBLIC/INTERNAL oraz logow audytu.

## Reguly szczegolne
- SECRET: dostep tylko ADMIN oraz osoby w allowed_users.
- CONFIDENTIAL: dostep MANAGER dzialu i allowed_users.
- INTERNAL: dostep tylko dzial i allowed_users.

## Egzekwowanie
- Logika w `documents/permissions.py` i `documents/views.py`.
