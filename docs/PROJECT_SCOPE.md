# PROJECT SCOPE: Kontrola Dostęp do Zasobów Informacyjnych

## Cel Projektu
Celem projektu jest zaprojektowanie i wykonanie aplikacji webowej, która kontroluje dostęp użytkowników do zasobów informacyjnych organizacji (np. dokumentów) na podstawie ich ról, przypisanych działów oraz poziomu poufności dokumentu.

## Problem Biznesowy
Użytkownicy w organizacjach często uzyskują niekontrolowany dostęp do dokumentów firmowych. System ten zapobiega wyciekom informacji wewnętrznych poprzez restrykcyjne filtrowanie widocznych zasobów. Dostęp przydzielany jest zgodnie z regułą minimalnych uprawnień. Każda próba dostępu jest audytowana.

## Użytkownicy Systemu (Role)
- **ADMIN**: Pełny dostęp, potrafi zarządzać użytkownikami, działami, dokumentami i widzi wszystkie logi.
- **MANAGER**: Odpowiada za swój dział. Widzi, dodaje i edytuje dokumenty w obrębie swojego działu.
- **EMPLOYEE**: Zwykły pracownik. Widzi dokumenty o poziomie PUBLIC oraz INTERNAL w ramach swojego działu. Nie może modyfikować, dodawać ani usuwać.
- **AUDITOR**: Dostęp kontrolny w trybie tylko do odczytu (do dokumentów publicznych/wewnętrznych) oraz dostęp do pełnego podglądu logów audytu.

## Poziomy Poufności (Confidentiality Levels)
- `PUBLIC`: Publiczny (dla zalogowanych).
- `INTERNAL`: Wewnętrzny dla danego działu.
- `CONFIDENTIAL`: Poufny, tylko dla menedżerów działu i admina.
- `SECRET`: Tajny, tylko dla admina (lub osób z indywidualnym dostępem, w tym zakresie MVP dla admina).

## Zakres MVP (Minimal Viable Product)
- Logowanie użytkowników (JWT/Sesje).
- Implementacja struktury ról (Admin, Manager, Employee, Auditor).
- Wprowadzenie Działów.
- Dokumenty jako zasoby z określeniem poziomu poufności.
- Widok listy dokumentów z filtrowaniem dostępności dla danego użytkownika.
- Możliwość wejścia w szczegóły dokumentu i zabezpieczenie przez `403 Forbidden` w przypadku braku praw (bezpośredni link).
- Dodawanie i edycja dokumentów (zależnie od uprawnień).
- Blokowanie nieautoryzowanych prób dostępu i logowanie każdej próby (udanej i odrzuconej).
- Frontend webowy oparty o React pozwalający na realizację przepływów.
