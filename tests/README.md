# Tests

This folder mirrors the backend module layout and contains unit, integration, and permission tests.

## Quick run (unittest)

```powershell
python tests\run_tests.py
```

## Notes
- The test harness bootstraps Django settings from `backend/config/settings.py`.
- If you prefer Django's built-in runner, use `backend/manage.py test` for app-level tests.
