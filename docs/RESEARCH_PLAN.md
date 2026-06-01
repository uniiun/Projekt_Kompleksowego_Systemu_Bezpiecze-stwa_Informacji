# Czesc badawcza (plan)

## Cel badania
- Ocena skutecznosci mechanizmow MFA i kontroli dostepu.
- Porownanie metod uwierzytelniania pod katem bezpieczenstwa i uzytecznosci.

## Pytania badawcze
- Czy MFA redukuje liczbe odmow dostepu wynikajacych z bledow logowania?
- Ktora metoda MFA jest szybsza i bardziej akceptowana przez uzytkownikow?

## Hipotezy badawcze
- H1: MFA (TOTP lub WebAuthn) zmniejsza liczbe odmow dostepu.
- H2: WebAuthn oferuje krotszy czas logowania niz TOTP.

## Metryki i dane
- Skutecznosc: liczba `ACCESS_DENIED`, liczba nieudanych logowan.
- Uzytecznosc: czas logowania (srednia, mediana, odchylenie), ocena satysfakcji (1-5).
- Bezpieczenstwo: FAR/FRR (na podstawie literatury dla biometrii).

## Procedura badawcza
1. Konfiguracja srodowiska i kont: ADMIN, MANAGER, EMPLOYEE, AUDITOR.
2. Wlaczenie MFA w dwoch wariantach: TOTP i WebAuthn.
3. Seria logowan (min. 30 prob na wariant) i rejestracja czasu.
4. Ankiety uzytkownikow (min. 5-10 osob) po wykonaniu zadan.
5. Analiza logow audytu przed i po wlaczeniu MFA.

## Testy penetracyjne (koncepcja)
- Proby obejscia kontroli dostepu przez bezposrednie URL do dokumentow.
- Proby dostepu do `SECRET` bez bycia w `allowed_users`.
- Weryfikacja blokady edycji/usuwania dla rol EMPLOYEE i AUDITOR.

## Narzedzia i zrodla
- Logi audytu z `/api/audit-logs/`.
- Pomiar czasu (stoper + zapis w arkuszu).
- Zrodla literaturowe: NIST, FIDO Alliance, publikacje nt. FAR/FRR.

## Zagrozenia dla trafnosci
- Mala liczba uczestnikow badania.
- Zaleznosc od konkretnego sprzetu (WebAuthn).
- Efekt uczenia sie przy wielokrotnych probach.

## Kryteria sukcesu
- Spadek odsetka nieudanych logowan po wdrozeniu MFA.
- Brak nieautoryzowanego dostepu do `SECRET` w testach.
- Srednia ocena uzytecznosci >= 4/5 dla wybranej metody MFA.
