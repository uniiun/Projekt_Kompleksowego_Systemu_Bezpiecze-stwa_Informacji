# migrations.py – uruchamia migracje Django jednym poleceniem
# Użyj: python migrations.py
# Użyj: python start.py
import os
import subprocess
import sys


def run_manage(py_cmd, args):
    """Uruchamia manage.py z podanymi argumentami."""
    cmd = [py_cmd, "manage.py"] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print("Błąd:", result.stderr, file=sys.stderr)
        sys.exit(result.returncode)


if __name__ == "__main__":
    # Ścieżka do katalogu projektu (gdzie znajduje się manage.py)
    project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
    os.chdir(project_dir)
    python_executable = sys.executable

    print("Tworzenie migracji...")
    run_manage(python_executable, ["makemigrations"])
    print("Stosowanie migracji...")
    run_manage(python_executable, ["migrate"])
    print("Migracje zakończone pomyślnie.")
