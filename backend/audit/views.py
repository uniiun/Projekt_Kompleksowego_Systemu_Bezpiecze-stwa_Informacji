from accounts.permissions import IsAdminRole
from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AccessLog
from .serializers import AccessLogSerializer


class AccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccessLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        queryset = AccessLog.objects.all().order_by("-created_at")

        if role not in ["ADMIN", "AUDITOR"]:
            return AccessLog.objects.none()

        document_id = self.request.query_params.get("document")
        if document_id:
            queryset = queryset.filter(document_id=document_id)

        return queryset

    def list(self, request, *args, **kwargs):
        role = request.user.profile.role
        if role not in ["ADMIN", "AUDITOR"]:
            return Response(
                {"detail": "Brak uprawnień do tego zasobu."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().list(request, *args, **kwargs)


class SystemDiagnosticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    @staticmethod
    def _normalize_jwt_algorithm(jwt_algorithm):
        normalized = (jwt_algorithm or "HS256").upper()
        if normalized == "HS256":
            return "HMAC-SHA256"
        return normalized

    @staticmethod
    def _is_audit_chain_valid():
        logs = AccessLog.objects.order_by("created_at", "id")
        previous_hash = ""

        for log in logs:
            if (log.prev_hash or "") != previous_hash:
                return False

            if not log.entry_hash:
                return False

            expected_hash = log.calculate_entry_hash(previous_hash)
            if log.entry_hash != expected_hash:
                return False

            previous_hash = log.entry_hash

        return True

    def get(self, request):
        now = timezone.now()
        last_1h = now - timezone.timedelta(hours=1)
        last_24h = now - timezone.timedelta(hours=24)
        last_7d = now - timezone.timedelta(days=7)

        total_logs = AccessLog.objects.count()
        recent_logs_qs = AccessLog.objects.filter(created_at__gte=last_24h)
        recent_logs_count = recent_logs_qs.count()

        denied_last_1h = AccessLog.objects.filter(
            action="ACCESS_DENIED", created_at__gte=last_1h
        ).count()
        denied_last_24h = AccessLog.objects.filter(
            action="ACCESS_DENIED", created_at__gte=last_24h
        ).count()
        denied_last_7d = AccessLog.objects.filter(
            action="ACCESS_DENIED", created_at__gte=last_7d
        ).count()

        failed_events_last_24h = recent_logs_qs.filter(success=False).count()
        last_event = AccessLog.objects.order_by("-created_at").first()
        last_incident = (
            AccessLog.objects.filter(action="ACCESS_DENIED")
            .order_by("-created_at")
            .first()
        )

        db_engine = settings.DATABASES.get("default", {}).get("ENGINE", "unknown")
        db_is_sqlite = "sqlite" in db_engine.lower()

        jwt_config = getattr(settings, "SIMPLE_JWT", {})
        jwt_algorithm = jwt_config.get("ALGORITHM", "HS256")
        jwt_algorithm_label = self._normalize_jwt_algorithm(jwt_algorithm)

        encryption_in_transit_enabled = bool(
            getattr(settings, "SECURE_SSL_REDIRECT", False)
            or getattr(settings, "CSRF_COOKIE_SECURE", False)
            or getattr(settings, "SESSION_COOKIE_SECURE", False)
        )
        transport_cipher = (
            "TLS enforced" if encryption_in_transit_enabled else "HTTP dev mode"
        )
        encryption_standard = f"{transport_cipher} + JWT {jwt_algorithm_label}"

        audit_pipeline_active = "audit.middleware.AuditMiddleware" in getattr(
            settings, "MIDDLEWARE", []
        )
        audit_hashing_enabled = bool(getattr(settings, "AUDIT_HASHING_ENABLED", False))
        audit_chain_valid = (
            self._is_audit_chain_valid() if audit_hashing_enabled else False
        )
        audit_integrity = (
            audit_pipeline_active and audit_hashing_enabled and audit_chain_valid
        )

        if denied_last_1h >= 5 or denied_last_24h >= 20:
            threat_level = "HIGH"
        elif denied_last_24h >= 5 or failed_events_last_24h >= 5:
            threat_level = "ELEVATED"
        else:
            threat_level = "LOW"

        return Response(
            {
                "service_status": "ONLINE",
                "encryption_standard": encryption_standard,
                "encryption_in_transit_enabled": encryption_in_transit_enabled,
                "jwt_algorithm": jwt_algorithm,
                "jwt_algorithm_label": jwt_algorithm_label,
                "audit_hashing_enabled": audit_hashing_enabled,
                "audit_pipeline_active": audit_pipeline_active,
                "audit_chain_valid": audit_chain_valid,
                "audit_integrity_ok": audit_integrity,
                "threat_level": threat_level,
                "denied_last_1h": denied_last_1h,
                "denied_last_24h": denied_last_24h,
                "denied_last_7d": denied_last_7d,
                "failed_events_last_24h": failed_events_last_24h,
                "recent_audit_events_24h": recent_logs_count,
                "total_logs": total_logs,
                "last_event_at": last_event.created_at if last_event else None,
                "last_incident_at": last_incident.created_at if last_incident else None,
                "rbac_db_engine": db_engine,
                "rbac_db_online": bool(db_engine),
                "rbac_db_is_sqlite": db_is_sqlite,
            }
        )
