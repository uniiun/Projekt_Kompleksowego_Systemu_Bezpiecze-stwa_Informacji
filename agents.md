# AGENTS.md — instrukcja dla agentów
## Kontekst projektu
- Aplikacja to system kontroli dostępu do dokumentów organizacji: RBAC + ograniczenia po dziale + poziom poufności.
- Backend: `backend/` (Django + DRF + SimpleJWT), frontend: `frontend/` (React + Vite + Bootstrap), dokumentacja: `docs/`.
- Główne źródła prawdy: `README.md`, `agents.md`, `docs/API_CONTRACT.md`, `docs/DATABASE_MODEL.md`, `docs/TEST_SCENARIOS.md`.
## Architektura i przepływ danych
- API jest wystawione z `backend/config/urls.py` jako `/api/auth/login/`, `/api/me/`, `/api/departments/`, `/api/documents/`, `/api/audit-logs/`.
- `accounts` trzyma `Profile` z `role`, `department`, MFA (`mfa_enabled`, `totp_secret`) i automatycznie tworzy profil przez sygnał `post_save`.
- `documents` zawiera `Department` i `Document`; dostęp do dokumentów filtruje `DocumentViewSet.get_queryset()`, a szczegółowa kontrola jest w `documents/permissions.py`.
- `audit` zapisuje każdą akcję do `AccessLog`; `audit.middleware.AuditMiddleware` tworzy wpisy m.in. dla `LOGIN`, `VIEW_LIST`, `VIEW_DOCUMENT`, `CREATE_DOCUMENT`, `UPDATE_DOCUMENT`, `DELETE_DOCUMENT`, `ACCESS_DENIED`.
## Konwencje implementacyjne
- Kontrola uprawnień musi być po stronie backendu; frontend może tylko ukrywać przyciski, ale nie zastępuje walidacji.
- Role w kodzie są stringami: `ADMIN`, `MANAGER`, `EMPLOYEE`, `AUDITOR`; poziomy poufności: `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `SECRET`.
- `DocumentSerializer` dodaje pola pomocnicze, np. `department_name`, `created_by_name`, `allowed_users_list`; nie zmieniaj ich bez potrzeby, bo frontend ich używa.
- Frontend pobiera dane przez `frontend/src/api/apiClient.js`; token jest trzymany w `localStorage` pod kluczem `access_token`.
## Wzorce UI
- Routing jest w `frontend/src/App.jsx`; wszystkie widoki poza `/login` są chronione przez `ProtectedRoute`.
- `Navbar.jsx` odczytuje `/api/me/` i pokazuje link do audytu tylko dla `ADMIN`, `AUDITOR` i `MANAGER`.
- `DocumentsPage.jsx` filtruje lokalnie po tytule/opisie, dziale i poufności, ale sama lista z `/api/documents/` jest już odfiltrowana po uprawnieniach.
## Workflow deweloperski
- Lokalny start: `python run.py` z katalogu głównego; skrypt tworzy `.venv`, instaluje backend i frontend oraz uruchamia oba serwery.
- Docker: `docker-compose up --build` z katalogu głównego; porty to `8000` dla backendu i `5173` dla frontendu.
- Frontend: `cd frontend; npm run dev` / `npm run build`.
- Backend: `cd backend; python manage.py runserver` oraz typowo `python manage.py makemigrations && python manage.py migrate`.
- Dane demonstracyjne są w `backend/create_fixtures.py` i tworzą konta testowe z README.
## Przy pracy nad zmianami
- Najpierw sprawdź, czy zmiana dotyka backendu, frontendu, czy dokumentacji; nie mieszaj dużych zmian między warstwami.
- Jeśli modyfikujesz dostęp do dokumentów, sprawdź jednocześnie: `documents/views.py`, `documents/permissions.py`, `audit/middleware.py` i odpowiadający widok w React.
- Jeśli dodajesz nowy endpoint, zaktualizuj też kontrakt w `docs/API_CONTRACT.md` i ewentualne użycia w `frontend/src/`.
- Dla nowych reguł biznesowych preferuj prostą, jawnie opisaną logikę; to projekt akademicki, więc czytelność jest ważniejsza niż abstrakcje.
