# Polityki i SoD

## Polityki hasel
- Minimalna dlugosc i zlozonosc wymuszana przez walidatory Django.
- Hasla nie sa zapisywane w postaci jawnej.
- Zmiana hasla po incydencie lub podejrzeniu kompromitacji.

## Polityki kluczy i tokenow
- MFA wymagane dla kont ADMIN i zalecane dla MANAGER.
- Reset MFA tylko przez ADMIN.
- Kody zapasowe przechowywane jako zaszyfrowane dane profilu.

## Urzadzenia biometryczne
- Rejestracja biometrii tylko na urzadzeniach zaufanych.
- Dezaktywacja klucza WebAuthn przy utracie urzadzenia.

## SoD (separacja obowiazkow)
- ADMIN: zarzadza kontami i politykami.
- AUDITOR: tylko odczyt logow audytu.
- EMPLOYEE/AUDITOR: brak edycji/usuwania dokumentow.
- Ustawienie SECRET i allowed_users tylko przez ADMIN.

## Procedury organizacyjne
- Weryfikacja tozsamosci przed nadaniem roli ADMIN.
- Cykliczny przeglad uprawnien (patrz `docs/LOG_REVIEW_PLAN.md`).
- Dokumentowanie zmian ról i dzialow w audycie.

## Szkolenia uzytkownikow
- Bezpieczne przechowywanie hasel i tokenow.
- Rozpoznawanie phishingu i socjotechniki.
- Procedura zglaszania incydentow.


