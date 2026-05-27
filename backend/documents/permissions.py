from rest_framework import permissions


# Klasa uprawnien DRF weryfikujaca dostep do dokumentow (RBAC)
class IsAuthorizedForDocument(permissions.BasePermission):

    # Podstawowa weryfikacja dostepu do widoku
    def has_permission(self, request, _view):
        # Sprawdzenie czy uzytkownik jest zalogowany
        if not request.user or not request.user.is_authenticated:
            return False

        # Dodawanie dokumentu dozwolone tylko dla ADMIN i MANAGER
        if request.method == "POST":
            return request.user.profile.role in ["ADMIN", "MANAGER"]

        return True

    # Szczegolowa weryfikacja uprawnien do konkretnego dokumentu
    def has_object_permission(self, request, _view, obj):
        user = request.user
        role = user.profile.role

        # Administrator ma pelny dostep do wszystkiego
        if role == "ADMIN":
            return True

        # Pracownik i audytor nie moga edytowac ani usuwac
        if request.method in ["PUT", "PATCH", "DELETE"]:
            if role not in ["ADMIN", "MANAGER"]:
                return False

        # Menedzer nie moze usuwac dokumentow
        if request.method == "DELETE" and role == "MANAGER":
            return False

        # Menedzer moze edytowac tylko dokumenty przypisane do jego dzialu
        if request.method in ["PUT", "PATCH"] and role == "MANAGER":
            return obj.department == user.profile.department

        # Poziom SECRET dostepny tylko dla osob przypisanych do allowed_users (oraz admina)
        if obj.confidentiality_level == "SECRET":
            return user in obj.allowed_users.all()

        # Poziom PUBLIC dostepny dla wszystkich zalogowanych
        if obj.confidentiality_level == "PUBLIC":
            return True

        # Poziom INTERNAL dostepny dla uzytkownikow tego samego dzialu, a takze dla audytorow i osob przypisanych
        if obj.confidentiality_level == "INTERNAL":
            if role == "AUDITOR":
                return True
            return (
                obj.department == user.profile.department
                or user in obj.allowed_users.all()
            )

        # Poziom CONFIDENTIAL dostepny dla menedzera tego dzialu, a takze dla osob jawnie przypisanych
        if obj.confidentiality_level == "CONFIDENTIAL":
            if role == "MANAGER":
                return (
                    obj.department == user.profile.department
                    or user in obj.allowed_users.all()
                )
            return user in obj.allowed_users.all()

        return False
