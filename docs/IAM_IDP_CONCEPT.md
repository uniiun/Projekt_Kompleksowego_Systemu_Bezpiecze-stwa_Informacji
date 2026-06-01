# IAM/IdP (koncepcja)

## Cel
- Centralne zarzadzanie tozsamosciami i dostepem.
- Integracja z katalogami (LDAP/AD).

## Integracja koncepcyjna
- Synchronizacja kont z Active Directory lub LDAP.
- SSO przez OpenID Connect lub SAML.
- IdP: Keycloak, Okta, Microsoft Entra ID.

## Mapowanie atrybutow
- Grupy AD/LDAP -> role RBAC.
- Atrybut department -> ABAC (dzial).
- Atrybut status -> aktywacja/dezaktywacja konta.

## Scenariusz MVP
- Lokalna baza uzytkownikow (Django User + Profile).
- Mozliwosc migracji do IdP w kolejnym etapie.

## Etapy rozwoju
1. PoC: logowanie przez OIDC.
2. Synchronizacja rol i dzialow z katalogiem.
3. Centralne zarzadzanie MFA.


