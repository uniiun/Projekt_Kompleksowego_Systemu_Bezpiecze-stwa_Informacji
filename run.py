# Sprawdzanie i przygotowanie srodowiska dla projektu oraz uruchamianie serwerow

import os
import shutil
import subprocess
import sys


def main():
    # Sprawdzenie czy skrypt jest uruchomiony w glownym katalogu projektu
    root_dir = os.getcwd()
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    if not os.path.exists(backend_dir) or not os.path.exists(frontend_dir):
        print("Blad: Skrypt musi byc uruchomiony w glownym katalogu projektu (root).")
        print(f"Obecny katalog: {root_dir}")
        sys.exit(1)

    print("=== Rozpoczynanie weryfikacji srodowiska ===")

    # Sprawdzenie czy Node.js jest zainstalowany
    if not shutil.which("node"):
        print("Blad: Node.js nie jest zainstalowany w systemie.")
        print("Pobierz i zainstaluj Node.js z oficjalnej strony: https://nodejs.org/")
        sys.exit(1)
    else:
        # Pobranie wersji Node.js
        node_version = subprocess.getoutput("node --version").strip()
        print(f"Wykryto Node.js: {node_version}")

    # Sprawdzenie czy npm jest zainstalowany
    if not shutil.which("npm"):
        print("Blad: npm nie jest zainstalowany w systemie.")
        sys.exit(1)
    else:
        # Pobranie wersji npm
        npm_version = subprocess.getoutput("npm --version").strip()
        print(f"Wykryto npm: {npm_version}")

    # Sprawdzenie i konfiguracja wirtualnego srodowiska Python (.venv)
    venv_dir = os.path.join(root_dir, ".venv")
    if sys.platform == "win32":
        venv_python = os.path.join(venv_dir, "Scripts", "python.exe")
        venv_pip = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        venv_python = os.path.join(venv_dir, "bin", "python")
        venv_pip = os.path.join(venv_dir, "bin", "pip")

    if not os.path.exists(venv_dir):
        print("Nie znaleziono wirtualnego srodowiska (.venv). Tworzenie nowego...")
        try:
            subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)
            print("Wirtualne srodowisko zostalo pomyslnie utworzone.")
        except Exception as e:
            print(f"Blad podczas tworzenia wirtualnego srodowiska: {e}")
            sys.exit(1)
    else:
        print("Wykryto istniejace wirtualne srodowisko (.venv).")

    # Instalacja zaleznosci backendu (requirements.txt)
    requirements_file = os.path.join(backend_dir, "requirements.txt")
    if os.path.exists(requirements_file):
        print("Instalowanie/Aktualizowanie zaleznosci backendu (pip)...")
        try:
            # Uaktualnienie pip wewnatrz venv
            subprocess.run(
                [venv_python, "-m", "pip", "install", "--upgrade", "pip"], check=True
            )
            # Instalacja paczek z requirements.txt
            subprocess.run([venv_pip, "install", "-r", requirements_file], check=True)
            print("Zaleznosci backendu zostaly pomyslnie zainstalowane.")
        except Exception as e:
            print(f"Blad podczas instalowania zaleznosci backendu: {e}")
            sys.exit(1)
    else:
        print("Ostrzezenie: Nie znaleziono pliku backend/requirements.txt.")

    # Instalacja zaleznosci frontendu (npm install)
    node_modules_dir = os.path.join(frontend_dir, "node_modules")
    package_json = os.path.join(frontend_dir, "package.json")

    if os.path.exists(package_json):
        if not os.path.exists(node_modules_dir):
            print(
                "Nie znaleziono folderu node_modules. Instalowanie zaleznosci frontendu (npm install)..."
            )
            try:
                # Na Windowsie npm jest plikiem cmd, dlatego shell=True moze byc wymagane
                subprocess.run("npm install", shell=True, cwd=frontend_dir, check=True)
                print("Zaleznosci frontendu zostaly pomyslnie zainstalowane.")
            except Exception as e:
                print(f"Blad podczas instalowania zaleznosci frontendu: {e}")
                sys.exit(1)
        else:
            print("Zaleznosci frontendu (node_modules) sa juz zainstalowane.")
    else:
        print("Ostrzezenie: Nie znaleziono pliku frontend/package.json.")

    print("=== Weryfikacja zakonczona sukcesem ===")
    print("Uruchamianie serwerow...")

    # Uruchomienie aplikacji w zaleznosci od systemu operacyjnego
    if sys.platform == "win32":
        # Windows: Uruchamiamy serwery w osobnych oknach cmd, co ulatwia czytanie logow i zamykanie procesow
        print("Uruchamianie backendu i frontendu w nowych oknach konsoli...")

        # Komenda do uruchomienia Django
        django_cmd = f'cmd /k "title Serwer Backend (Django) && "{venv_python}" backend\\manage.py runserver"'
        subprocess.Popen(django_cmd, shell=True)

        # Komenda do uruchomienia Vite (React)
        vite_cmd = 'cmd /k "title Serwer Frontend (Vite) && npm run dev"'
        subprocess.Popen(vite_cmd, shell=True, cwd=frontend_dir)
    else:
        # Inne systemy (Linux / macOS)
        print("Uruchamianie backendu i frontendu w tle...")
        backend_proc = None
        frontend_proc = None
        try:
            backend_proc = subprocess.Popen(
                [venv_python, "backend/manage.py", "runserver"]
            )
            frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir)

            # Oczekiwanie na zakonczenie dzialania procesow
            backend_proc.wait()
            frontend_proc.wait()
        except KeyboardInterrupt:
            print("\nZamykanie serwerow...")
            if backend_proc:
                backend_proc.terminate()
            if frontend_proc:
                frontend_proc.terminate()
            print("Serwery zostaly zatrzymane.")

    print("Serwery zostaly uruchomione! Mozesz teraz korzystac z aplikacji.")


if __name__ == "__main__":
    main()
