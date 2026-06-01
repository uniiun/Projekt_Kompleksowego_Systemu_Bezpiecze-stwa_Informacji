# Dokumentacja glowna (wersja akademicka)

## 1. Cel i zakres projektu
Projekt zaklada zaprojektowanie i analize systemu kontroli dostepu do zasobow
informacyjnych organizacji. System ogranicza dostep zgodnie z zasada
najmniejszych uprawnien i rejestruje wszystkie zdarzenia dostepu.

## 2. Zakres funkcjonalny
- Uwierzytelnianie z MFA (TOTP, WebAuthn).
- Autoryzacja RBAC + ABAC (dzial + poufnosc).
- Audyt zdarzen dostepu.
- IAM: onboarding, zmiana roli, offboarding.

## 3. Model kontroli dostepu
- RBAC mapuje role na uprawnienia.
- ABAC wykorzystuje atrybuty (dzial, poufnosc, allowed_users).
- Szczegoly: `docs/ACCESS_MODEL_JUSTIFICATION.md`.

## 4. Uwierzytelnianie i MFA
- Haslo jako skladnik podstawowy.
- TOTP i WebAuthn jako drugi skladnik.
- Szczegoly: `docs/AUTH_METHODS.md`.

## 5. Biometria
- W projekcie: WebAuthn (Windows Hello - odcisk palca).
- Proces enrollment i weryfikacji: `docs/BIOMETRICS.md`.

## 6. IAM i cykl zycia dostepu
- Procesy: `docs/IAM_LIFECYCLE.md`, `docs/IAM_PROCESS.md`.
- Koncepcja IdP: `docs/IAM_IDP_CONCEPT.md`.

## 7. Audyt i monitoring
- Logi audytu i plan przegladow: `docs/LOG_REVIEW_PLAN.md`.

## 8. Polityki i SoD
- Polityki hasel, tokenow i urzadzen: `docs/POLICIES_SOD.md`.
- Macierz uprawnien: `docs/ACCESS_MATRIX.md`.

## 9. Czesc badawcza
- Plan bada: `docs/RESEARCH_PLAN.md`.

## 10. Mapowanie wymagan
- Tabela zgodnosci: `docs/REQUIREMENTS_TRACEABILITY.md`.
