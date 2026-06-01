# Uzasadnienie modelu kontroli dostepu

## Wybor modelu
- RBAC: role odzwierciedlaja funkcje organizacyjne.
- ABAC: atrybuty (dzial, poufnosc, allowed_users) precyzuja dostep.

## Uzasadnienie doboru
- RBAC upraszcza nadawanie uprawnien i mapuje strukture organizacji.
- ABAC minimalizuje nadawanie zbyt szerokich uprawnien.
- Polaczenie RBAC+ABAC wspiera PoLP oraz SoD.

## Atrybuty w modelu ABAC
- department: powiazanie z dzialem.
- confidentiality_level: PUBLIC/INTERNAL/CONFIDENTIAL/SECRET.
- allowed_users: dostep indywidualny do wyjatkow.

## Przyklady regul
- SECRET: tylko ADMIN i allowed_users.
- CONFIDENTIAL: MANAGER dzialu i allowed_users.
- INTERNAL: dzial + allowed_users.

## Powiazanie z implementacja
- Reguly autoryzacji: `backend/documents/permissions.py`.
- Ograniczenia SoD: `backend/documents/views.py`.
- Macierz uprawnien: `docs/ACCESS_MATRIX.md`.

## Zasada PoLP
- Domyslna rola nowego uzytkownika to EMPLOYEE.
- Eskalacja uprawnien wymaga decyzji ADMIN.
