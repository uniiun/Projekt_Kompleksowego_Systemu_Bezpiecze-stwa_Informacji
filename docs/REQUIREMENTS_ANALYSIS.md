# Analiza wymagan i zasobow

## Cel i kontekst
System zapewnia kontrolowany dostep do zasobow informacyjnych organizacji
(dokumentow) z wykorzystaniem RBAC i ABAC, zgodnie z zasada najmniejszych
uprawnien, z pelnym audytem zdarzen.

## Interesariusze
- Zarzad/ADMIN: odpowiedzialnosc za polityki i nadawanie uprawnien.
- Menedzerowie dzialow: operacyjna praca na dokumentach dzialu.
- Pracownicy: bezpieczny dostep do dokumentow potrzebnych do pracy.
- Audytorzy: niezalezny wglad w logi i zdarzenia.

## Zasoby informacyjne
- Dokumenty firmowe (pliki, metadane, historia zmian).
- Dane kont uzytkownikow (role, dzialy, statusy, MFA).
- Logi audytowe i diagnostyka systemu.

## Role i grupy
- ADMIN: pelny dostep i zarzadzanie uzytkownikami.
- MANAGER: zarzadzanie dokumentami wlasnego dzialu.
- EMPLOYEE: odczyt dokumentow PUBLIC/INTERNAL w dziale.
- AUDITOR: odczyt dokumentow publicznych/wewnetrznych i logow audytu.

## Wymagania funkcjonalne (skrot)
1. Logowanie uzytkownikow z MFA (TOTP/WebAuthn).
2. Kontrola dostepu do dokumentow wedlug roli, dzialu i poufnosci.
3. Dostep indywidualny (allowed_users) do zasobow wyjatkowych.
4. Audyt wszystkich zdarzen dostepu (udane i zablokowane).
5. IAM: onboarding, zmiana roli, offboarding, reset MFA.

## Wymagania niefunkcjonalne (skrot)
- Bezpieczenstwo: MFA, RBAC+ABAC, SoD, audyt.
- Uzytecznosc: proste scenariusze logowania i pracy na dokumentach.
- Niezawodnosc: jednoznaczne reguly dostepu, przewidywalne komunikaty.

## Analiza ryzyka
| Ryzyko | Skutek | Kontrola/mitigacja |
| --- | --- | --- |
| Eskalacja roli | Nieautoryzowany dostep | RBAC, SoD, audyt zmian |
| Dostep miedzy dzialami | Wyciek informacji | ABAC po dziale |
| Przejecie konta | Naruszenie poufnosci | MFA, polityka hasel |
| Brak monitoringu | Brak wykrycia incydentu | Logi i przeglady |

## Zalozenia i ograniczenia
- MVP opiera sie na lokalnej bazie kont (Django User + Profile).
- Poziomy poufnosci i dostep po dziale sa obowiazkowe.
- Przygotowana jest koncepcja integracji z IdP, bez wdrozenia.

## Kryteria akceptacji
- Brak dostepu do dokumentow spoza uprawnien (403).
- Rejestracja wszystkich zdarzen dostepu w logach.
- MFA dziala dla kont z wlaczonym drugim skladnikiem.


