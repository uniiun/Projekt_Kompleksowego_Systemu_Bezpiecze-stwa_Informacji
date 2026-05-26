AGENTS.md — standard pracy agenta dla projektu
1. Kontekst projektu
Projekt dotyczy systemu kontroli dostępu do zasobów informacyjnych organizacji.
Nazwa robocza projektu:
System kontroli dostępu do dokumentów organizacji
Celem aplikacji jest umożliwienie przechowywania dokumentów firmowych oraz kontrolowanie dostępu do nich na podstawie roli użytkownika, działu organizacyjnego i poziomu poufności dokumentu.
Projekt powinien być realizowany jako aplikacja webowa z wykorzystaniem Pythona.
Rekomendowany stack technologiczny:
Backend: Python, Django, Django REST Framework
Frontend: React, Bootstrap
Baza danych: SQLite na start, opcjonalnie PostgreSQL
Autoryzacja: JWT lub mechanizm sesji Django
Repozytorium: GitHub
Dokumentacja: Markdown w folderze `docs/`
---
2. Główne założenie biznesowe
System ma rozwiązywać problem niekontrolowanego dostępu do dokumentów i danych wewnętrznych organizacji.
W organizacji istnieją różne działy, np.:
IT
HR
Finanse
Zarząd
Sprzedaż
Audyt
Każdy dział posiada dokumenty o różnym poziomie poufności. Nie każdy użytkownik może widzieć, pobierać, edytować lub usuwać każdy dokument.
System powinien wymuszać reguły dostępu oraz zapisywać historię operacji w module audytu.
---
3. Zakres funkcjonalny MVP
Agent powinien w pierwszej kolejności realizować wersję MVP, czyli minimalną działającą wersję systemu.
Zakres MVP:
Logowanie użytkowników.
Role użytkowników.
Działy organizacyjne.
Dokumenty jako zasoby informacyjne.
Poziomy poufności dokumentów.
Lista dokumentów filtrowana według uprawnień.
Szczegóły dokumentu.
Dodawanie dokumentów przez uprawnionych użytkowników.
Edycja dokumentów przez uprawnionych użytkowników.
Blokowanie nieautoryzowanego dostępu.
Rejestrowanie działań w logach audytu.
Panel administratora lub endpointy administracyjne.
Podstawowy frontend umożliwiający korzystanie z systemu.
Funkcje dodatkowe, które można dodać później:
pobieranie plików,
upload dokumentów,
eksport logów do CSV,
wyszukiwarka,
filtrowanie po dziale i poziomie poufności,
indywidualne przydzielanie dostępu do dokumentu,
Docker,
testy automatyczne,
PostgreSQL.
---
4. Role użytkowników
W systemie powinny istnieć następujące role:
ADMIN
Administrator ma pełny dostęp do systemu.
Może:
zarządzać użytkownikami,
zarządzać działami,
widzieć wszystkie dokumenty,
dodawać dokumenty,
edytować dokumenty,
usuwać dokumenty,
przeglądać wszystkie logi audytu.
MANAGER
Menedżer odpowiada za dokumenty swojego działu.
Może:
widzieć dokumenty swojego działu,
dodawać dokumenty do swojego działu,
edytować dokumenty swojego działu,
widzieć wybrane logi dotyczące swojego działu.
Nie powinien:
zarządzać użytkownikami,
widzieć dokumentów innych działów, jeśli nie ma takiego uprawnienia,
usuwać dokumentów innych działów.
EMPLOYEE
Pracownik ma ograniczony dostęp.
Może:
widzieć dokumenty publiczne,
widzieć dokumenty wewnętrzne swojego działu,
przeglądać szczegóły dokumentów, do których ma dostęp.
Nie może:
dodawać dokumentów,
edytować dokumentów,
usuwać dokumentów,
przeglądać logów audytu,
widzieć dokumentów poufnych i tajnych bez dodatkowego uprawnienia.
AUDITOR
Audytor ma dostęp kontrolny.
Może:
przeglądać dostępne dokumenty w trybie tylko do odczytu,
przeglądać logi audytu,
analizować historię działań użytkowników.
Nie może:
dodawać dokumentów,
edytować dokumentów,
usuwać dokumentów,
zarządzać użytkownikami.
---
5. Poziomy poufności dokumentów
Dokument powinien mieć jeden z poziomów poufności:
`PUBLIC` — dokument publiczny dla zalogowanych użytkowników,
`INTERNAL` — dokument wewnętrzny dostępny dla użytkowników z właściwego działu,
`CONFIDENTIAL` — dokument poufny dostępny dla administratora i menedżera właściwego działu,
`SECRET` — dokument tajny dostępny tylko dla administratora lub użytkowników z indywidualnym dostępem.
---
6. Reguły biznesowe kontroli dostępu
Agent powinien implementować dostęp według poniższych zasad.
Reguła 1
Użytkownik niezalogowany nie ma dostępu do zasobów systemu.
Reguła 2
Administrator ma pełny dostęp do wszystkich zasobów i operacji.
Reguła 3
Menedżer ma dostęp do dokumentów przypisanych do jego działu.
Reguła 4
Pracownik widzi dokumenty publiczne oraz dokumenty wewnętrzne swojego działu.
Reguła 5
Audytor widzi dokumenty w trybie tylko do odczytu i ma dostęp do logów audytu.
Reguła 6
Dokumenty `SECRET` są dostępne tylko dla administratora lub użytkowników indywidualnie przypisanych do dokumentu.
Reguła 7
Każda próba dostępu do dokumentu powinna być zapisana w logach, zarówno udana, jak i odrzucona.
Reguła 8
Jeżeli użytkownik próbuje wykonać niedozwoloną operację, backend powinien zwrócić `403 Forbidden`, a frontend powinien pokazać komunikat o braku uprawnień.
---
7. Proponowana struktura repozytorium
Projekt powinien mieć jedną wspólną strukturę repozytorium:
```text
kontrola_dostepu_do_zasobow_informacyjnych/
|
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   ├── accounts/
│   ├── documents/
│   └── audit/
|
├── frontend/
│   ├── package.json
│   ├── src/
│   └── public/
|
├── docs/
│   ├── PROJECT_SCOPE.md
│   ├── API_CONTRACT.md
│   ├── DATABASE_MODEL.md
│   ├── TEST_SCENARIOS.md
│   └── logika_systemowa_biznesowa_kontrola_dostepu.pdf
|
├── AGENTS.md
├── README.md
└── .gitignore
```
---
8. Standard pracy agenta
Agent powinien działać według poniższych zasad.
8.1. Nie generować chaotycznych zmian
Każda zmiana powinna mieć konkretny cel, np.:
konfiguracja backendu,
dodanie modelu `Document`,
dodanie endpointu listy dokumentów,
dodanie strony logowania,
dodanie widoku listy dokumentów,
dodanie logów audytu.
Nie należy mieszać wielu dużych zmian w jednym kroku.
8.2. Zachowywać podział frontend/backend/docs
Kod backendu powinien trafiać tylko do folderu `backend/`.
Kod frontendu powinien trafiać tylko do folderu `frontend/`.
Dokumentacja powinna trafiać do folderu `docs/`.
8.3. Przed implementacją sprawdzać istniejące pliki
Przed modyfikacją agent powinien przeanalizować aktualną strukturę projektu i nie nadpisywać bez potrzeby istniejących plików.
8.4. Tworzyć kompletne pliki
Przy większych zmianach agent powinien zwracać pełną zawartość pliku lub wykonywać spójne zmiany w repozytorium.
8.5. Utrzymywać prosty kod
Projekt jest projektem akademickim. Kod powinien być czytelny i zrozumiały.
Należy unikać nadmiernie skomplikowanej architektury.
8.6. Najpierw MVP, potem dodatki
Agent powinien najpierw doprowadzić do działającej wersji minimalnej, a dopiero później proponować funkcje dodatkowe.
---
9. Backend — standard implementacji
Backend powinien być napisany w Django i Django REST Framework.
9.1. Aplikacje Django
Zalecane aplikacje:
`accounts` — użytkownicy, role, profile,
`documents` — dokumenty i zasoby,
`audit` — logi dostępu,
`config` — ustawienia projektu.
9.2. Modele danych
Minimalne modele:
Department
Pola:
`id`,
`name`,
`description`,
`created_at`.
User/Profile
Można użyć wbudowanego modelu `User` Django oraz rozszerzyć go przez model profilu.
Profil powinien zawierać:
`user`,
`role`,
`department`,
`is_active`.
Role:
`ADMIN`,
`MANAGER`,
`EMPLOYEE`,
`AUDITOR`.
Document
Pola:
`id`,
`title`,
`description`,
`file`,
`department`,
`confidentiality_level`,
`created_by`,
`allowed_users`,
`created_at`,
`updated_at`.
Poziomy poufności:
`PUBLIC`,
`INTERNAL`,
`CONFIDENTIAL`,
`SECRET`.
AccessLog
Pola:
`id`,
`user`,
`document`,
`action`,
`success`,
`ip_address`,
`message`,
`created_at`.
Akcje:
`LOGIN`,
`VIEW_DOCUMENT`,
`DOWNLOAD_DOCUMENT`,
`CREATE_DOCUMENT`,
`UPDATE_DOCUMENT`,
`DELETE_DOCUMENT`,
`ACCESS_DENIED`.
9.3. Uprawnienia
Logika dostępu powinna być wydzielona do osobnych funkcji lub klas, np.:
`can_view_document(user, document)`,
`can_create_document(user)`,
`can_update_document(user, document)`,
`can_delete_document(user, document)`,
`can_view_audit_logs(user)`.
Nie należy duplikować tej logiki w wielu miejscach.
9.4. API
Minimalne endpointy:
```text
POST /api/auth/login/
POST /api/auth/logout/
GET  /api/me/

GET  /api/departments/
POST /api/departments/

GET  /api/documents/
POST /api/documents/
GET  /api/documents/{id}/
PUT  /api/documents/{id}/
DELETE /api/documents/{id}/
GET  /api/documents/{id}/download/

GET  /api/audit-logs/
```
Endpointy powinny zwracać JSON.
9.5. Obsługa błędów
Standard odpowiedzi błędów:
```json
{
  "detail": "Brak uprawnień do tego zasobu."
}
```
Dla braku uprawnień używać statusu `403 Forbidden`.
Dla braku logowania używać statusu `401 Unauthorized`.
Dla nieistniejącego zasobu używać statusu `404 Not Found`.
---
10. Frontend — standard implementacji
Frontend powinien być napisany w React.
10.1. Biblioteki
Zalecane:
React,
React Router,
Axios,
Bootstrap.
10.2. Struktura frontendu
```text
frontend/src/
|
├── api/
│   └── apiClient.js
|
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── DocumentCard.jsx
│   └── LoadingSpinner.jsx
|
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── DocumentsPage.jsx
│   ├── DocumentDetailsPage.jsx
│   ├── AddDocumentPage.jsx
│   ├── EditDocumentPage.jsx
│   ├── UsersPage.jsx
│   └── AuditLogsPage.jsx
|
├── mock/
│   └── documents.js
|
├── App.jsx
└── main.jsx
```
10.3. Zasady frontendu
Frontend powinien:
korzystać z `apiClient.js` do komunikacji z backendem,
przechowywać token w bezpieczny i prosty sposób odpowiedni dla projektu akademickiego,
pokazywać komunikaty błędów,
ukrywać przyciski, których użytkownik nie powinien używać,
nie polegać wyłącznie na ukrywaniu przycisków — prawdziwa kontrola dostępu musi być w backendzie.
10.4. Mocki
Jeśli backend nie jest gotowy, frontend może korzystać z mockowanych danych.
Po integracji mocki powinny zostać zastąpione przez zapytania HTTP do API.
---
11. Dokumentacja projektu
W folderze `docs/` powinny znaleźć się pliki:
PROJECT_SCOPE.md
Opisuje:
cel projektu,
problem biznesowy,
użytkowników systemu,
zakres MVP,
funkcje dodatkowe.
API_CONTRACT.md
Opisuje:
endpointy,
format requestów,
format response,
kody błędów.
DATABASE_MODEL.md
Opisuje:
modele danych,
relacje między tabelami,
pola modeli.
TEST_SCENARIOS.md
Opisuje scenariusze testowe:
logowanie użytkownika,
dostęp administratora,
dostęp pracownika,
blokada nieautoryzowanego dostępu,
zapis logów audytu.
---
12. Scenariusze demonstracyjne
Agent powinien tak prowadzić implementację, aby możliwe było pokazanie poniższych scenariuszy na prezentacji.
Scenariusz 1 — Administrator
Administrator loguje się do systemu.
Widzi wszystkie dokumenty.
Może dodać dokument.
Może edytować dokument.
Może zobaczyć logi audytu.
Scenariusz 2 — Pracownik
Pracownik loguje się do systemu.
Widzi tylko dokumenty publiczne i wewnętrzne swojego działu.
Nie widzi dokumentów poufnych i tajnych.
Próba wejścia w cudzy dokument kończy się błędem `403 Forbidden`.
Próba jest zapisana w logach.
Scenariusz 3 — Menedżer
Menedżer loguje się do systemu.
Widzi dokumenty swojego działu.
Może dodać dokument do swojego działu.
Może edytować dokument swojego działu.
Scenariusz 4 — Audytor
Audytor loguje się do systemu.
Widzi logi audytu.
Może analizować historię dostępu.
Nie może edytować ani usuwać dokumentów.
---
13. Dane testowe
Agent powinien przygotować dane testowe lub fixture z przykładowymi użytkownikami.
Przykładowi użytkownicy:
```text
admin@example.com       ADMIN      Zarząd
manager.it@example.com  MANAGER    IT
employee.it@example.com EMPLOYEE   IT
employee.hr@example.com EMPLOYEE   HR
auditor@example.com     AUDITOR    Audyt
```
Przykładowe dokumenty:
```text
Polityka bezpieczeństwa IT     IT       INTERNAL
Raport finansowy Q1            Finanse  CONFIDENTIAL
Lista pracowników              HR       CONFIDENTIAL
Strategia zarządu              Zarząd   SECRET
Regulamin pracy                HR       PUBLIC
```
---
14. Git i standard pracy zespołowej
Projekt powinien być rozwijany w jednym repozytorium.
Zalecane gałęzie:
`main` — stabilna wersja,
`develop` — wspólna wersja robocza,
`feature/...` — konkretne zadania.
Przykładowe gałęzie:
`feature/backend-setup`,
`feature/frontend-setup`,
`feature/auth-api`,
`feature/documents-api`,
`feature/audit-logs`,
`feature/login-page`,
`feature/documents-page`,
`feature/docs`.
Zasady:
Nie commitować bezpośrednio do `main`.
Każda większa funkcja powinna być na osobnej gałęzi.
Przed rozpoczęciem pracy wykonać `git pull`.
Po zakończeniu pracy zrobić commit z jasnym opisem.
Pull Request powinien trafiać do `develop`.
Nie wrzucać folderów `venv`, `node_modules`, plików `.env` i lokalnych baz danych.
---
15. .gitignore
W projekcie powinien istnieć `.gitignore` zawierający przynajmniej:
```gitignore
# Python
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
.env
*.sqlite3
db.sqlite3
media/

# Django
staticfiles/

# Node
node_modules/
dist/
build/
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```
---
16. Kolejność implementacji
Agent powinien realizować projekt w następującej kolejności:
Utworzyć strukturę repozytorium.
Przygotować dokumentację w `docs/`.
Przygotować backend Django.
Skonfigurować Django REST Framework.
Dodać modele `Department`, `Profile`, `Document`, `AccessLog`.
Dodać migracje i panel admina Django.
Dodać logowanie i endpoint `/api/me/`.
Dodać logikę uprawnień.
Dodać endpointy dokumentów.
Dodać logi audytu.
Dodać dane testowe.
Przygotować frontend React.
Dodać widok logowania.
Dodać dashboard.
Dodać listę dokumentów.
Dodać szczegóły dokumentu.
Dodać formularz dodawania dokumentu.
Dodać widok logów audytu.
Połączyć frontend z backendem.
Przetestować scenariusze demonstracyjne.
Uzupełnić README i instrukcję uruchomienia.
---
17. Definicja ukończenia projektu
Projekt można uznać za gotowy, jeśli:
Użytkownik może się zalogować.
System rozpoznaje rolę użytkownika.
Dokumenty są filtrowane według uprawnień.
Niedozwolony dostęp jest blokowany.
Niedozwolony dostęp jest zapisywany w logach.
Administrator widzi pełną listę dokumentów i logów.
Pracownik widzi tylko swoje dozwolone dokumenty.
Menedżer może zarządzać dokumentami swojego działu.
Audytor widzi logi, ale nie może modyfikować dokumentów.
Projekt ma README z instrukcją uruchomienia.
Dokumentacja znajduje się w folderze `docs/`.
---
18. Ważne zasady jakości
Kod powinien być prosty i czytelny.
Nazwy zmiennych i funkcji powinny być opisowe.
Backend zawsze musi walidować uprawnienia, nawet jeśli frontend ukrywa przyciski.
Każda operacja na dokumencie powinna być rejestrowana w logach audytu.
Nie należy przechowywać haseł w kodzie.
Dane testowe mogą być używane tylko lokalnie.
Projekt powinien dać się uruchomić na komputerze innej osoby po przeczytaniu README.
---
19. Główna instrukcja dla agenta
Jeżeli agent analizuje ten projekt, powinien traktować ten plik jako główną instrukcję działania.
Najważniejsze cele agenta:
Utrzymać spójność biznesową systemu kontroli dostępu.
Nie pomijać logiki RBAC.
Nie implementować bezpieczeństwa wyłącznie po stronie frontendu.
Rozdzielać odpowiedzialności backendu, frontendu i dokumentacji.
Dążyć do działającego MVP.
Pisać kod prosty, czytelny i możliwy do obrony na projekcie akademickim.