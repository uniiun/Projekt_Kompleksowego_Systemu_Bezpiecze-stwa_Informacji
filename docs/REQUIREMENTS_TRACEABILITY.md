# Mapowanie wymagan (traceability)

| Wymaganie ze screenow | Dowod w dokumentacji | Dowod w systemie |
| --- | --- | --- |
| Analiza wymagan i zasobow | `docs/REQUIREMENTS_ANALYSIS.md`, `docs/ACCESS_RESOURCES.md` | `backend/documents/models.py`, `backend/accounts/models.py` |
| Dobor metod uwierzytelniania | `docs/AUTH_METHODS.md`, `docs/AUTH_POLICIES.md` | `/api/auth/*` endpoints |
| Biometria (wybor i enrollment) | `docs/BIOMETRICS.md`, `docs/BIOMETRIC_RISKS.md` | `/api/auth/webauthn/*` |
| MFA | `docs/AUTH_METHODS.md`, `docs/MFA_COMPARISON.md` | `/api/auth/verify-totp/`, `/api/auth/webauthn/*` |
| Model kontroli dostepu (RBAC/ABAC) | `docs/ACCESS_MODEL_JUSTIFICATION.md`, `docs/ACCESS_MATRIX.md` | `documents/permissions.py`, `documents/views.py` |
| PoLP i SoD | `docs/POLICIES_SOD.md`, `docs/ACCESS_MATRIX.md` | ograniczenia w backendzie |
| IAM (onboarding/offboarding) | `docs/IAM_LIFECYCLE.md`, `docs/IAM_PROCESS.md` | `/api/users/*` |
| Audyt i logowanie | `docs/LOG_REVIEW_PLAN.md` | `audit/middleware.py`, `/api/audit-logs/` |
| Plan przegladow | `docs/LOG_REVIEW_PLAN.md`, `docs/ACCESS_REVIEW.md` | procedura organizacyjna |
| Technologie i protokoly | `docs/TECH_PROTOCOLS.md`, `docs/TECH_STACK_DECISIONS.md` | konfiguracja projektu |
| Aspekty pracy zespolowej | `docs/TEAM_ROLES.md` | organizacja projektu |
| Czesc badawcza | `docs/RESEARCH_PLAN.md` | plan badan |

