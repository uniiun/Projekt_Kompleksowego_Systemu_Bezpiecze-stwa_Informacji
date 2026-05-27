from accounts.views import CurrentUserView, UserViewSet
from audit.views import AccessLogViewSet
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from documents.views import DepartmentViewSet, DocumentViewSet
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

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
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/me/", CurrentUserView.as_view(), name="current_user"),
    path("api/", include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
