# 📋 Plan Realizacji Projektu i Lista Zadań (TODO.md)
> Plik kanoniczny. Jeśli istnieje `todo`, traktuj go jako skrót.
**Projekt:** System Kontroli Dostępu do Zasobów Informacyjnych z Modułem Biometrycznym i MFA (SecureDocs)
**Docelowa Ocena:** 5.0 (Spełnia pełen zakres podstawowy, rozszerzony oraz badawczo-naukowy)

---

## 🗺️ Harmonogram i Kamienie Milowe (Milestones)
* **Milestone 1: Architektura, Środowisko i Kontrakty API (Wymagany czas: 15%)**
    * *Cel:* Postawienie czystego środowiska wielokontenerowego, repozytorium oraz pełne zmapowanie struktur danych.
* **Milestone 2: Rdzeń Backend – System Zarządzania Dokumentami i Kontrola Dostępu (Wymagany czas: 25%)**
    * *Cel:* Implementacja bazy danych, mechanizmu autoryzacji RBAC/ABAC oraz automatycznego audytu zdarzeń.
* **Milestone 3: Zaawansowane Uwierzytelnianie – MFA i Komponent Biometryczny (Wymagany czas: 25%)**
    * *Cel:* Implementacja dwuskładnikowości (TOTP/WebAuthn) oraz modułu przetwarzania/symulacji biometrycznej.
* **Milestone 4: Frontend – Panel Użytkownika i Integracja z API (Wymagany czas: 20%)**
    * *Cel:* Budowa kompletnego, responsywnego interfejsu w React z obsługą ról i wieloetapowego logowania.
* **Milestone 5: Część Badawczo-Naukowa i Analiza Bezpieczeństwa (Wymagany czas: 10%)**
    * *Cel:* Przeprowadzenie testów wydajnościowych, analizy matematycznej FAR/FRR oraz symulacji ataków spoofing/pen-testów.
* **Milestone 6: Refaktoryzacja, Dokumentacja Końcowa i Przygotowanie do Obrony (Wymagany czas: 5%)**
    * *Cel:* Przygotowanie skryptów demonstracyjnych, raportu z badań i prezentacji projektu.

---

## 🛠️ Szczegółowa Lista Zadań (Per-Milestone)

### 🚀 MILESTONE 1: Architektura, Środowisko i Kontrakty API
- [ ] **M1.1: Konfiguracja Monorepo i Konteneryzacji (Docker)**
  - [x] Przygotować strukturę katalogów: `/backend`, `/frontend`, `/docs`.
  - [x] Stworzyć plik `docker-compose.yml` definiujący kontenery: `backend` (Django), `db` (PostgreSQL), `frontend` (React/Node). *(W PRAKTYCE: są tylko kontenery `backend` i `frontend`, baza to SQLite w `backend/db.sqlite3`)*
  - [ ] Skonfigurować pliki `.gitignore` oraz `.env.example` dla backendu i frontendu. *(JEST: `.gitignore`; BRAK: `.env.example`)*
- [ ] **M1.2: Modelowanie Bazy Danych i Przygotowanie Struktur**
  - [x] Przenieść konceptualny model danych (User, Department, Document, DocumentPermission, AccessLog) na szablony deklaratywne w Django ORM. *(ZREALIZOWANE: `Department`, `Document`, `AccessLog`; zamiast `DocumentPermission` użyto `Document.allowed_users`)*
  - [ ] Zaimplementować rozszerzenia modelu użytkownika (`AbstractUser`) o pola `role` oraz `department`. *(OBECNIE: `User` + `Profile` w `backend/accounts/models.py`)*
- [ ] **M1.3: Ustalenie Kontraktu API (API_CONTRACT.md)**
  - [x] Rozpisać pełną specyfikację REST API (endpointy, oczekiwane body, kody odpowiedzi HTTP: 200, 201, 401, 403, 404).
  - [ ] Rozbudować kontrakt o punkty końcowe dla uwierzytelniania dwuskładnikowego (MFA) oraz przesyłania danych biometrycznych.

### 🔐 MILESTONE 2: Rdzeń Backend – System Zarządzania Dokumentami i Kontrola Dostępu
- [x] **M2.1: Autoryzacja i Konfiguracja Sesji bazowej**
  - [x] Zintegrować `djangorestframework-simplejwt` w celu obsługi tokenów Stateless JWT (Access/Refresh tokens).
  - [x] Stworzyć endpoint `/api/auth/login/` (Krok 1: weryfikacja loginu i hasła).
- [x] **M2.2: Implementacja Silnika Decyzyjnego Kontroli Dostępu (RBAC/ABAC)**
  - [x] Napisać customową klasę uprawnień w DRF: `IsAuthorizedForDocument(permissions.BasePermission)`.
  - [x] Zaimplementować w kodzie algorytm sprawdzający:
    - [x] Czy użytkownik to `ADMIN` (pełen bypass)?
    - [x] Czy poziom dokumentu to `PUBLIC`?
    - [x] Zgodność działu użytkownika z działem dokumentu (`INTERNAL`, `CONFIDENTIAL`).
    - [x] Restrykcje dla poziomu `SECRET` (tylko admin lub jawna lista `allowed_users`).
    - [x] Restrykcje per rola (np. `EMPLOYEE` nie może modyfikować/usuwać, `AUDITOR` tylko odczyt).
- [x] **M2.3: Moduł Automatycznego Audytu (Audit Engine)**
  - [x] Stworzyć mechanizm przechwytywania zdarzeń dostępowych (np. poprzez Django Middleware lub Signals).
  - [x] Zapewnić logowanie do tabeli `AccessLog` zdarzeń: `LOGIN`, `VIEW_LIST`, `VIEW_DOCUMENT`, `DOWNLOAD_DOCUMENT`, `CREATE_DOCUMENT`, `UPDATE_DOCUMENT`, `DELETE_DOCUMENT`, `ACCESS_DENIED` (z IP i statusem HTTP).
  - [ ] Zabezpieczyć endpoint `/api/audit-logs/` tak, aby dostęp mieli tylko `ADMIN` oraz `AUDITOR`. *(OBECNIE: dostęp mają także `MANAGER` w `backend/audit/views.py`)*

### 🧬 MILESTONE 3: Zaawansowane Uwierzytelnianie – MFA i Komponent Biometryczny
- [ ] **M3.1: Implementacja Drugiego Składnika (MFA - TOTP)**
  - [x] Zintegrować bibliotekę `pyotp` do generowania sekretów kryptograficznych per użytkownik. *(JEST: `backend/accounts/models.py` + `pyotp` w `requirements.txt`)*
  - [ ] Stworzyć endpoint do aktywacji MFA (generowanie tajnego klucza oraz kodu QR dla Google Authenticator/Authy). *(WIDOK JEST: `EnableMFAView`, ale brak routingu w `backend/config/urls.py`)*
  - [ ] Stworzyć endpoint `/api/auth/verify-totp/` sprawdzający poprawność kodu jednorazowego przed wydaniem ostatecznego tokenu JWT. *(WIDOK JEST: `VerifyMFAView`, brak routingu i brak spięcia z logowaniem)*
- [ ] **M3.2: Implementacja Komponentu Biometrycznego (Wybór technologii)**
  - [ ] *Opcja A (Zaawansowana):* Integracja standardu WebAuthn (FIDO2/U2F) umożliwiającego użycie biometrii systemowej (Windows Hello, TouchID/FaceID) za pomocą przeglądarki.
  - [ ] *Opcja B (Algorytmiczno-Symulacyjna - OpenCV/Python):* Stworzenie modułu przyjmującego plik/zdjęcie (np. odcisk palca, próbka głosu).
    - [ ] Napisać skrypt w OpenCV ekstrahujący punkty charakterystyczne (minucje w odcisku palca lub spektrogram głosu).
    - [ ] Stworzyć bazę "wzorców" przypisanych do profili użytkowników i endpoint porównujący przesłany plik z wzorcem z określonym progiem tolerancji (Threshold).
- [ ] **M3.3: Projekt Procesów Rejestracji i Weryfikacji (Enrollment & Verification)**
  - [ ] Zaimplementować bezpieczny proces rejestracji nowej biometrii (wymagany wcześniejszy stan autoryzacji loginem i hasłem).
  - [ ] Opracować procedury awaryjne (Fallback) w przypadku awarii sensora biometrycznego (np. kody zapasowe).

### 🖥️ MILESTONE 4: Frontend – Panel Użytkownika i Integracja z API
- [ ] **M4.1: Konfiguracja Architektury Aplikacji React**
  - [x] Postawić szkielet aplikacji z wykorzystaniem React Router v6 i Bootstrap/Tailwind.
  - [ ] Zaimplementować globalny stan uwierzytelniania (Context API lub Redux Toolkit). *(OBECNIE: token czytany bezpośrednio z `localStorage` w komponentach)*
  - [ ] Stworzyć komponenty typu Guard: `<ProtectedRoute>` (blokada dla niezalogowanych) oraz `<RoleProtectedRoute>` (weryfikacja ról). *(JEST: tylko `ProtectedRoute`)*
- [ ] **M4.2: Implementacja Wieloetapowego Przepływu Logowania (Multi-step Login)**
  - [ ] Ekran 1: Login + Hasło. Po poprawnym uwierzytelnieniu backend zwraca flagę `mfa_required: true` oraz tymczasowy token sesji. *(OBECNIE: zwykły login JWT bez `mfa_required`)*
  - [ ] Ekran 2: Dynamiczne przejście do weryfikacji składnika (MFA TOTP code input ORAZ/LUB wywołanie natywnego API biometrycznego / formularz przesyłania próbki).
- [x] **M4.3: Widoki Systemowe i Obsługa Zabezpieczeń w UI**
  - [x] Ekran Dashboard / Lista Dokumentów: Pobieranie przefiltrowanej listy z `/api/documents/`. Zaimplementować conditional rendering przycisków akcji (Edycja/Usuwanie) na podstawie roli użytkownika wyciągniętej z JWT.
  - [x] Implementacja formularza dodawania/edycji dokumentu z listą wyboru poziomów poufności (`PUBLIC` -> `SECRET`) i przypisaniem do odpowiedniego działu.
  - [x] Ekran Logów Audytowych: Tabela przeznaczona wyłącznie dla Audytora i Administratora z funkcją filtrowania po typie zdarzenia (np. tylko próby nieautoryzowane).
  - [ ] Globalna obsługa błędów za pomocą interceptorów Axios (przechwytywanie błędu 403 i renderowanie komponentu informującego o złamaniu zasady najmniejszych uprawnień). *(OBECNIE: interceptor obsługuje tylko 401 w `frontend/src/api/apiClient.js`)*

### 📊 MILESTONE 5: Część Badawczo-Naukowa i Analiza Bezpieczeństwa
- [ ] **M5.1: Matematyczno-Statystyczna Analiza Modułu Biometrycznego**
  - [ ] Przygotować zestaw testowy (np. 10 różnych próbek biometrycznych poprawnych i 10 niepoprawnych).
  - [ ] Wyznaczyć wskaźniki **FAR** (False Acceptance Rate - współczynnik fałszywych akceptacji) oraz **FRR** (False Rejection Rate - współczynnik fałszywych odrzuceń) dla zaimplementowanego algorytmu/progu dopasowania.
  - [ ] Sporządzić wykres zależności FAR/FRR od progu decyzyjnego (Threshold) i umieścić go w raporcie.
- [ ] **M5.2: Analiza Podatności na Spoofing i Ataki Prezentacji**
  - [ ] Przeprowadzić symulowane testy oszukania systemu (np. próba logowania zdjęciem wyświetlonym na telefonie, odtworzeniem nagrania głosu).
  - [ ] Opisać w dokumentacji wyniki oraz zaproponować mechanizmy obronne (np. algorytmy *Liveness Detection* / wykrywanie żywotności).
- [ ] **M5.3: Koncepcja Testów Penetracyjnych i Bezpieczeństwa Aplikacji**
  - [ ] Przeprowadzić symulację ataku typu IDOR (Insecure Direct Object Reference) – próba bezpośredniego odpytania API o ID dokumentu `SECRET` przez konto zwykłego pracownika. Potwierdzić w logach, że backend zwraca 403, a zdarzenie jest odnotowane w bazie.
  - [ ] Zweryfikować odporność na SQL Injection (dzięki Django ORM) oraz tokeny JWT pod kątem ataku *None Algorithm*.
- [ ] **M5.4: Badanie Użyteczności (Usability Study)**
  - [ ] Zmierzyć czas potrzebny na zalogowanie użytkownika w trzech konfiguracjach: 1) Tylko hasło, 2) Hasło + TOTP, 3) Hasło + Biometria.
  - [ ] Zebrać i opracować wyniki w formie tabeli porównawczej.

### 📝 MILESTONE 6: Refaktoryzacja, Dokumentacja Końcowa i Przygotowanie do Obrony
- [ ] **M6.1: Pokrycie Kodu Testami Automatycznymi**
  - [ ] Napisać testy jednostkowe i integracyjne w Django (`pytest` lub `django.test.TestCase`) weryfikujące pełną macierz uprawnień (scenariusze T-01 do T-10 z dokumentacji specyfikacji).
- [ ] **M6.2: Finalizacja Dokumentacji Projektowej (`/docs`)**
  - [x] Zaktualizować plik `README.md` (instrukcja uruchomienia projektu w Dockerze za pomocą jednej komendy `docker-compose up --build`).
  - [ ] Przygotować finalny raport z części badawczej (wyniki testów FAR/FRR, wnioski z analizy bezpieczeństwa i testów użyteczności).
- [x] **M6.3: Przygotowanie Środowiska Demonstracyjnego**
  - [x] Przygotować skrypt db-seed zasiedlający bazę danych kontami testowymi (admin, manager, pracownik, audytor) oraz przykładowymi dokumentami z różnych działów w celu sprawnego przeprowadzenia prezentacji przed komisją.

---

## 👥 Podział Pracy w Zespole (Rekomendacja)

| Rola w projekcie | Przypisane zadania (Milestones) |
| :--- | :--- |
| **Osoba 1: Backend Developer / Architekt** | Kamień Milowy 1 (część DB/Docker), Kamień Milowy 2 (Silnik autoryzacji, API, logi), M6.1 (Testy API). |
| **Osoba 2: Frontend Developer** | Kamień Milowy 4 (Cały interfejs React, routing, integracja z API, integracja komponentów UI dla MFA). |
| **Osoba 3: Specjalista ds. Biometrii i Badań / Analityk** | Kamień Milowy 3 (Moduł biometrii i MFA na backendzie), Kamień Milowy 5 (Cała część badawcza, FAR/FRR, testy usability, raport). |
| **Rola Wspólna / Rotacyjna** | Kamień Milowy 6 (Dokumentacja końcowa, przygotowanie prezentacji i obrony projektu). |

---

### 📌 Kryteria akceptacji zadania (Definition of Done - DoD):
1. Kod przeszedł pomyślnie code review drugiego członka zespołu.
2. Zmiany nie powodują błędów w dotychczasowych testach automatycznych integracji backendu z frontendem.
3. Każda operacja objęta regułą biznesową generuje odpowiedni wpis w encji `AccessLog`.
4. Kod został wypchnięty na dedykowany branch `feature/...`, a następnie zmergowany Pull Requestem do gałęzi `develop`. Brak commitów bezpośrednio do `main`.
