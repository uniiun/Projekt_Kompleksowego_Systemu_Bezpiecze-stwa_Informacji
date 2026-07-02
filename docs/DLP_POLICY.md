# Polityka Zapobiegania Utracie Danych (DLP Policy)

## 1. Cel i Zakres
Celem niniejszej polityki jest minimalizacja ryzyka nieautoryzowanego ujawnienia, modyfikacji lub kradzieży danych wrażliwych przetwarzanych w systemie (zgodnie z załącznikiem A.8.1 ISO/IEC 27001). Polityka obejmuje zautomatyzowane procedury skanowania dokumentów, ochronę wizualną oraz raportowanie audytowe.

## 2. Moduł Skanera DLP (Data Loss Prevention)
Wszystkie nowo wgrywane dokumenty oraz modyfikacje istniejących zasobów przechodzą przez obowiązkowy proces zautomatyzowanej inspekcji treści (backend: `dlp.py`). Skaner w czasie rzeczywistym identyfikuje:
- **Dane Osobowe (PII)**: Numery PESEL (walidowane pod kątem zgodności sumy kontrolnej).
- **Dane Finansowe (PCI-DSS)**: Numery kart płatniczych (walidowane algorytmem Luhna).
- **Słowa Kluczowe**: Frazy wskazujące na wysoki stopień poufności, takie jak: "TAJNE", "POUFNE", "TOP SECRET", "CONFIDENTIAL", "DO NIEJAWNYCH", "WRAŻLIWE".

## 3. Zautomatyzowana Klasyfikacja (Auto-Escalation)
Jeśli system DLP wykryje w pliku jakiekolwiek dane wymienione w sekcji 2:
1. Poziom poufności dokumentu jest natychmiast i automatycznie podnoszony do poziomu **`CONFIDENTIAL`** (jeśli jego dotychczasowa klasyfikacja była niższa, tj. `PUBLIC` lub `INTERNAL`).
2. Operacja ta zapobiega przypadkowemu ujawnieniu danych pracownikom bez odpowiedniego poświadczenia bezpieczeństwa.

## 4. Rejestrowanie Incydentów (Audit Trail)
Każde wykrycie danych wrażliwych przez system DLP skutkuje:
1. Utworzeniem dedykowanego zdarzenia o typie **`DLP_ALERT`** w kryptograficznym dzienniku audytu (AccessLog).
2. Zapisaniem powiązanego użytkownika, dokładnej daty, adresu IP oraz zidentyfikowanego typu danych (np. "PESEL, KEYWORD:POUFNE").
3. Administratorzy i Audytorzy mają bieżący dostęp do tych statystyk poprzez Konsolę Diagnostyczną (Dashboard).

## 5. Zabezpieczenie przed Wyciekiem Wzrokowym (Visual DLP)
Dla dokumentów sklasyfikowanych jako `CONFIDENTIAL` lub `SECRET` (w tym tych, które zostały oflagowane przez system DLP), w podglądzie dokumentu nakładany jest dynamiczny, trudny do usunięcia znak wodny (Watermark) zawierający:
- Adres e-mail użytkownika przeglądającego plik.
- Bieżącą datę.
- Znacznik `DLP PROTECTED`.
Ma to na celu zniechęcenie użytkowników do wykonywania zrzutów ekranu lub zdjęć ekranu za pomocą telefonu.
