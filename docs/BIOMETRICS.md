# Biometria

## Zakres i wybory technologii
- Rozpoznawanie twarzy, odcisk palca, teczowka, glos, dynamika pisania.
- W projekcie wybrano WebAuthn jako warstwe biometrii (Windows Hello).

## Uzasadnienie wyboru
- Standard FIDO2 i wsparcie systemowe.
- Brak przechowywania surowych danych biometrycznych w aplikacji.
- Odpornosc na phishing i przechwytywanie hasel.

## Proces enrollment (rejestracja)
1. Uzytkownik inicjuje rejestracje WebAuthn.
2. Serwer generuje wyzwanie (challenge) i przekazuje do klienta.
3. Urzadzenie tworzy pare kluczy i podpisuje challenge.
4. Aplikacja zapisuje klucz publiczny i identyfikator credential.

## Proces weryfikacji
1. Serwer generuje challenge logowania.
2. Urzadzenie podpisuje challenge kluczem prywatnym.
3. Serwer weryfikuje podpis i wydaje tokeny.

## Prywatnosc i bezpieczenstwo
- Biometria pozostaje na urzadzeniu uzytkownika.
- Aplikacja przechowuje jedynie klucz publiczny.

## Ryzyka
- Spoofing na poziomie urzadzenia (np. maska/twarz na zdjeciu).
- Wymuszenie rejestracji na niezaufanym urzadzeniu.

## Mitigacje
- Wymuszenie user verification i ochrona urzadzenia.
- Reset MFA i usuwanie kluczy po utracie urzadzenia.


