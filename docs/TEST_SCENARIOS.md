# Scenariusze Testowe (Demonstracyjne)

## Cel testów
Weryfikacja ról w systemie i odcięcia dostępu na podstawie poziomów poufności oraz sprawdzenie funkcjonalności audytu (rejestr akcji).

---

### Scenariusz 1 — Dostęp Administratora
1. Administrator loguje się do systemu (np. `admin@example.com`).
2. Otwiera zakładkę "Dokumenty".
3. **Wynik:** Widzi wszystkie dokumenty ze wszystkich działów. Posiada obok nich opcje Edycji oraz Usuwania.
4. Otwiera zakładkę "Logi Audytu".
5. **Wynik:** Posiada wgląd w całą historię dostępu w systemie.

### Scenariusz 2 — Ograniczony Dostęp Pracownika (Employee)
1. Pracownik (np. `employee.it@example.com`) loguje się do systemu.
2. Otwiera zakładkę "Dokumenty".
3. **Wynik:** Widzi tylko dokumenty należące do działu "IT" o poziomie "INTERNAL" oraz wszystkie dokumenty ogólnofirmowe o poziomie "PUBLIC". Nie widzi dokumentów "CONFIDENTIAL", "SECRET" ani dokumentów innego działu (np. "HR").
4. Pracownik próbuje wymusić wyświetlenie dokumentu HR wchodząc na jego sztywny URL (np. `/documents/5`).
5. **Wynik:** Na ekranie ukazuje się komunikat braku uprawnień (Błąd HTTP `403 Forbidden`).
6. **Wynik w tle:** Akcja próby wpisania `/documents/5` zostaje odnotowana w backendzie w tabeli `AccessLog` jako nieudany dostęp `ACCESS_DENIED`.

### Scenariusz 3 — Menedżer operujący we własnym dziale
1. Menedżer loguje się do systemu (np. `manager.it@example.com`).
2. Otwiera zakładkę "Dokumenty".
3. **Wynik:** Widzi dokumenty swojego działu oraz publiczne. Ma opcję ich edycji i dodawania nowych elementów ze statusem np. `CONFIDENTIAL`. 
4. Nie widzi dokumentów z innych działów poza dokumentami "PUBLIC".

### Scenariusz 4 — Audytor przeglądający działania
1. Audytor loguje się do systemu (np. `auditor@example.com`).
2. Otwiera zakładkę "Dokumenty".
3. **Wynik:** Widzi dokumenty, ale nie posiada żadnych przycisków Edycji / Usuwania / Dodawania.
4. Otwiera "Logi Audytu".
5. **Wynik:** Może przejrzeć historię, aby zweryfikować kto próbował wejść na niedozwolone dokumenty i w jakich godzinach.
