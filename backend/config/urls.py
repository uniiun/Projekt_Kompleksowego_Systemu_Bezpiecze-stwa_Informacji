from accounts.views import (
    CurrentUserView,
    CustomTokenObtainPairView,
    DisableMFAView,
    EnableMFAView,
    UserViewSet,
    VerifyMFAView,
)
from audit.views import AccessLogViewSet
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from documents.views import DepartmentViewSet, DocumentViewSet
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView

# MFA endpoints
# Enable MFA generates a secret for the user
# VerifyMFA checks a provided OTP token
# DisableMFA turns off MFA for the user


router = routers.DefaultRouter()
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"documents", DocumentViewSet, basename="document")
router.register(r"audit-logs", AccessLogViewSet, basename="audit-log")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"
    ),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/verify-totp/", VerifyMFAView.as_view(), name="verify_totp"),
    path("api/auth/mfa/enable/", EnableMFAView.as_view(), name="enable_mfa"),
    path("api/auth/mfa/disable/", DisableMFAView.as_view(), name="disable_mfa"),
    path("api/me/", CurrentUserView.as_view(), name="current_user"),
    path("api/", include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
