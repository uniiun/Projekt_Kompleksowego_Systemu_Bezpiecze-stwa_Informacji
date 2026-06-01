# Plan przegladu logow i uprawnien

## Cel
- Wczesne wykrywanie nieautoryzowanego dostepu.
- Kontrola zgodnosci uprawnien z rolami.

## Czestotliwosc
- Przeglad logow: co tydzien.
- Przeglad uprawnien: co miesiac.
- Przeglad kont nieaktywnych: co kwartal.

## Zakres
- Logi dostepu do dokumentow.
- Logi odmow (ACCESS_DENIED).
- Zmiany ról i dzialow (akcje IAM).

## Procedura
1. Eksport logow z `/api/audit-logs/`.
2. Filtrowanie zdarzen ACCESS_DENIED i anomalii.
3. Przeglad zmian ról i kont.
4. Dokumentacja w raporcie przegladu.

## Eskalacja
- Krytyczne naruszenia: natychmiast do ADMIN.
- Powtarzalne odmowy: weryfikacja roli i dzialu.

## Wynik przegladu
- Raport z odchyleniami.
- Plan korekty uprawnien.
- Dokumentacja decyzji i zmian.


