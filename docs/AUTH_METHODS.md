# Dobor metod uwierzytelniania

## Model "cos co wiesz / masz / jestes"
- Cos co wiesz: haslo lub PIN.
- Cos co masz: token TOTP lub klucz FIDO2.
- Cos czym jestes: biometria realizowana przez WebAuthn (np. Windows Hello).

## Hasla (podstawa uwierzytelniania)
- Haslo jest pierwszym skladnikiem uwierzytelniania.
- Polityka zlozonosci jest egzekwowana przez walidatory Django.
- Hasla sa przechowywane jako hash zgodnie ze standardem Django.

## Tokeny i klucze (drugi skladnik)
- TOTP: aplikacje typu Google Authenticator, Authy.
- WebAuthn/FIDO2: klucze sprzetowe lub Windows Hello.

## Biometria (drugi skladnik)
- Biometria nie jest przechowywana w aplikacji.
- Aplikacja zapisuje jedynie klucz publiczny WebAuthn.

## Uzasadnienie doboru
- Haslo + TOTP: niski koszt, szybkie wdrozenie, szeroka akceptacja.
- WebAuthn/FIDO2: wysoki poziom bezpieczenstwa i odpornosc na phishing.
- Konfiguracja MFA zalezy od roli i ryzyka (ADMIN/MANAGER).

## Mapowanie na system
- Logowanie: `/api/auth/login/`.
- Weryfikacja TOTP: `/api/auth/verify-totp/`.
- WebAuthn: `/api/auth/webauthn/*`.


