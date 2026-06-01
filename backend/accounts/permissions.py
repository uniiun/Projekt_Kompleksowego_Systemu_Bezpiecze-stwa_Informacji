from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, _view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "profile", None)
            and request.user.profile.role == "ADMIN"
        )
