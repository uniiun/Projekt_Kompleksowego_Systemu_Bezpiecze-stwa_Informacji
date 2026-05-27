# System Kontroli Dostepu do Dokumentow Organizacji

Projekt akademicki realizujacy system kontroli dostepu do zasobow informacyjnych (dokumentow) w organizacji na podstawie rol uzytkownikow, dzialow oraz poziomow poufnosci dokumentow (RBAC / ABAC).

## Stack Technologiczny
- **Backend:** Python, Django, Django REST Framework
- **Frontend:** React (Vite), Bootstrap
- **Baza danych:** SQLite (domyslnie)

---

## Sposoby Uruchamiania Projektu

Projekt mozna uruchomic na dwa sposoby: lokalnie przy uzyciu jednego skryptu Python lub w kontenerach Docker (np. na serwerze Debian na Proxmox).

### Sposób 1: Lokalnie za pomocą jednego pliku (Windows / Linux)
Wszystkie kroki weryfikacji środowiska, instalacji brakujących zależności i uruchamiania serwerów zostały skonsolidowane w jednym, uniwersalnym skrypcie: **`run.py`**.

Aby uruchomić projekt lokalnie, wywołaj w terminalu w głównym katalogu:

#### Windows (Zalecane)
1. Otwórz terminal (PowerShell lub CMD) w głównym folderze projektu.
2. Uruchom polecenie:
   ```bash
   python run.py
   ```
   *Uwaga: Skrypt automatycznie wykryje brakujące biblioteki i zainstaluje je w wirtualnym środowisku.*

#### Linux (Debian) / macOS
```bash
python3 run.py
```

Skrypt automatycznie:
1. Sprawdza obecność Node.js i npm.
2. Tworzy wirtualne środowisko `.venv` i instaluje zależności z `backend/requirements.txt`.
3. Instaluje zależności frontendu (`npm install`), jeśli brak folderu `node_modules`.
4. Uruchamia serwer backendu (Django, port 8000) oraz frontendu (Vite, port 5173).

#### Rozwiązywanie problemów (Co sprawdzić, gdy frontend/backend nie startuje)
- **Problem: Skrypt `run.py` kończy się błędem lub okna konsoli natychmiast się zamykają.**
  - Sprawdź czy Python jest w PATH: `python --version`.
  - Sprawdź czy Node.js jest zainstalowany: `node -v` oraz `npm -v`.
  - Spróbuj uruchomić backend ręcznie, aby zobaczyć błędy:
    ```bash
    cd backend
    ..\.venv\Scripts\python manage.py runserver
    ```
  - Spróbuj uruchomić frontend ręcznie:
    ```bash
    cd frontend
    npm run dev
    ```
- **Problem: Błędy migracji lub bazy danych.**
  - Uruchom: `python manage.py migrate` w folderze `backend/`.
- **Problem: Port 5173 (frontend) lub 8000 (backend) jest zajęty.**
  - Vite automatycznie spróbuje kolejnego portu (np. 5174). API Django wymaga portu 8000 – jeśli jest zajęty, zakończ proces go używający lub zmień port w `run.py`.
- **Problem: Brak uprawnień do wykonywania skryptów w PowerShell.**
  - Uruchom PowerShell jako Administrator i wykonaj: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`.

Jeśli chcesz nadpisać ustawienia (np. poziom logowania), użyj plików `backend/.env.example` i `frontend/.env.example` jako szablonów.

---

### Sposob 2: Za pomoca Dockera (Debian / Proxmox / Windows)
Projekt jest w pelni przystosowany do uruchomienia w kontenerach za pomoca Docker Compose. Jest to zalecana metoda wdrazania na serwerze Debian na Proxmox.

Wystarczy wykonac jedno polecenie w glownym katalogu projektu:
```bash
docker-compose up --build
```
Lub w tle (daemon mode):
```bash
docker-compose up -d --build
```

Dostep do aplikacji po uruchomieniu Dockera:
- **Frontend (React):** `http://localhost:5173` (lub IP Twojego serwera Proxmox, np. `http://192.168.1.X:5173`)
- **Backend (API Django):** `http://localhost:8000` (lub IP Twojego serwera Proxmox, np. `http://192.168.1.X:8000`)

---

## Logowanie wieloetapowe (MFA)
1. **Krok 1:** login i hasło (`/api/auth/login/`).
2. Jeśli konto ma MFA, backend zwraca `mfa_required: true` oraz `temp_token`.
3. **Krok 2:** weryfikacja kodu TOTP (`/api/auth/verify-totp/`) z `token` i `temp_token`.

W profilu użytkownika możesz aktywować MFA i wygenerować kod QR oraz kody zapasowe.

## Testy backendu
Uruchom zestaw testów (Django + testy w katalogu `tests`):
```bash
python tests/run_tests.py
```

## Struktura Uzytkownikow i Uprawnien

System opiera sie na nastepujacych rolach uzytkownikow:
- **ADMIN** - Pelny dostep do zarzadzania uzytkownikami, dzialami, wszystkimi dokumentami oraz logami audytowymi.
- **MANAGER** - Zarzadzanie dokumentami przypisanymi do jego dzialu; brak dostepu do logow audytu.
- **EMPLOYEE** - Dostep do dokumentow publicznych oraz wewnetrznych swojego dzialu. Brak mozliwosci edycji i usuwania.
- **AUDITOR** - Dostep do logow audytu oraz dokumentow w trybie tylko do odczytu.

### Poziomy Poufnosci Dokumentow:
1. `PUBLIC` - Dostepny dla wszystkich zalogowanych uzytkownikow.
2. `INTERNAL` - Dostepny dla uzytkownikow z danego dzialu.
3. `CONFIDENTIAL` - Dostepny dla administratora oraz menedzera wlasciwego dzialu.
4. `SECRET` - Dostepny wylacznie dla administratora lub osob z indywidualnym uprawnieniem.
