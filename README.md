# System Kontroli Dostepu do Dokumentow Organizacji

Projekt akademicki realizujacy system kontroli dostepu do zasobow informacyjnych (dokumentow) w organizacji na podstawie rol uzytkownikow, dzialow oraz poziomow poufnosci dokumentow (RBAC / ABAC).

## Stack Technologiczny
- **Backend:** Python, Django, Django REST Framework
- **Frontend:** React (Vite), Bootstrap
- **Baza danych:** SQLite (domyslnie)

---

## Sposoby Uruchamiania Projektu

Projekt mozna uruchomic na dwa sposoby: lokalnie przy uzyciu jednego skryptu Python lub w kontenerach Docker (np. na serwerze Debian na Proxmox).

### Sposob 1: Lokalnie za pomoca jednego pliku (Windows / Linux)
Wszystkie kroki weryfikacji srodowiska, instalacji brakujacych zaleznosci i uruchamiania serwerow zostaly skonsolidowane w jednym, uniwersalnym skrypcie: **`run.py`**.

Aby uruchomic projekt lokalnie, wywolaj w terminalu w glownym katalogu:

#### Windows
```bash
python run.py
```

#### Linux (Debian) / macOS
```bash
python3 run.py
```

Skrypt automatycznie:
1. Sprawdza obecnosc Node.js i npm.
2. Tworzy wirtualne srodowisko `.venv` i instaluje zaleznosci z `backend/requirements.txt`.
3. Instaluje zaleznosci frontendu (`npm install`), jesli brak folderu `node_modules`.
4. Uruchamia serwer backendu (Django, port 8000) oraz frontendu (Vite, port 5173).

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

## Struktura Uzytkownikow i Uprawnien

System opiera sie na nastepujacych rolach uzytkownikow:
- **ADMIN** - Pelny dostep do zarzadzania uzytkownikami, dzialami, wszystkimi dokumentami oraz logami audytowymi.
- **MANAGER** - Zarzadzanie dokumentami przypisanymi do jego dzialu oraz podglad wybranych logow.
- **EMPLOYEE** - Dostep do dokumentow publicznych oraz wewnetrznych swojego dzialu. Brak mozliwosci edycji i usuwania.
- **AUDITOR** - Dostep do logow audytu oraz wszystkich dokumentow w trybie tylko do odczytu.

### Poziomy Poufnosci Dokumentow:
1. `PUBLIC` - Dostepny dla wszystkich zalogowanych uzytkownikow.
2. `INTERNAL` - Dostepny dla uzytkownikow z danego dzialu.
3. `CONFIDENTIAL` - Dostepny dla administratora oraz menedzera wlasciwego dzialu.
4. `SECRET` - Dostepny wylacznie dla administratora lub osob z indywidualnym uprawnieniem.
