# Access Matrix i SoD

## Role vs akcje

| Akcja | ADMIN | MANAGER | EMPLOYEE | AUDITOR |
| --- | --- | --- | --- | --- |
| Lista dokumentow | YES | YES | YES | YES |
| Podglad dokumentu | YES | YES (swoj dzial) | YES (swoj dzial) | YES (public/internal) |
| Tworzenie dokumentu | YES | YES (swoj dzial) | NO | NO |
| Edycja dokumentu | YES | YES (swoj dzial) | NO | NO |
| Usuwanie dokumentu | YES | NO | NO | NO |
| Dostep do logow audytu | YES | NO | NO | YES |
| Zarzadzanie uzytkownikami | YES | NO | NO | NO |
| Ustawienie poziomu SECRET | YES | NO | NO | NO |
| Modyfikacja allowed_users | YES | NO | NO | NO |

## Zasada najmniejszych uprawnien (PoLP)
- Domyslna rola nowego konta to `EMPLOYEE`.
- Modyfikacje kont i podniesienie uprawnien sa dostepne tylko dla `ADMIN`.

## Separacja obowiazkow (SoD)
- Audytor ma tylko odczyt i nie moze tworzyc/edytowac/usuwac dokumentow.
- Role administracyjne (zarzadzanie uzytkownikami) sa odseparowane od roli audytora.
- Poziom `SECRET` i `allowed_users` moze ustawic tylko `ADMIN`.
- Ostatni administrator nie moze zostac zdezaktywowany.

