# Modele Bazy Danych

System bazuje na poniższych modelach z relacjami.

## 1. `Department` (Dział organizacyjny)
Określa działy, do których przynależą użytkownicy i dokumenty.
- `id` (PK)
- `name` (String, np. "IT", "HR")
- `description` (Text, Opcjonalnie)
- `created_at` (Datetime)

## 2. Wbudowany w Django `User` + `Profile`
Do podstawowej autoryzacji użyjemy modelu `User` Django (username przechowujący e-mail), rozszerzonego o tabelę `Profile`.
**Profile:**
- `user` (OneToOne do bazowego Usera)
- `role` (String Choices: `ADMIN`, `MANAGER`, `EMPLOYEE`, `AUDITOR`)
- `department` (ForeignKey do `Department`, null-able)

## 3. `Document`
Odzwierciedla zasób w systemie.
- `id` (PK)
- `title` (String)
- `description` (Text)
- `file` (FileField/Opcjonalne dla MVP)
- `department` (ForeignKey do `Department`)
- `confidentiality_level` (String Choices: `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `SECRET`)
- `created_by` (ForeignKey do `User`)
- `created_at` (Datetime)
- `updated_at` (Datetime)

## 4. `AccessLog` (Dziennik Audytu)
Rejestruje wszelkie akcje wykonane na zasobach (np. czytanie, modyfikacja) lub próby wykonania akcji niedozwolonych.
- `id` (PK)
- `user` (ForeignKey do `User`)
- `document` (ForeignKey do `Document`, opcjonalnie NULL jeśli log dotyczy logowania systemu)
- `action` (String Choices: `LOGIN`, `VIEW_DOCUMENT`, `CREATE_DOCUMENT`, `UPDATE_DOCUMENT`, `DELETE_DOCUMENT`, `ACCESS_DENIED`)
- `success` (Boolean, true przy operacjach pomyślnych, false przy ACCESS_DENIED)
- `ip_address` (GenericIPAddressField)
- `message` (Text, dodatkowy kontekst logu np. szczegóły operacji)
- `timestamp` / `created_at` (Datetime)
