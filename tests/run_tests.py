import os
import sys
from pathlib import Path


def main() -> int:
    tests_dir = Path(__file__).resolve().parent
    project_root = tests_dir.parent
    backend_dir = project_root / "backend"
    sys.path.insert(0, str(project_root))
    sys.path.insert(0, str(backend_dir))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    import django

    django.setup()

    from django.conf import settings
    from django.test.utils import get_runner

    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2, interactive=False)
    failures = test_runner.run_tests(["tests"])
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
