from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.auth import LoginView
urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/login/", LoginView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/", include("accounts.urls")),
    path("api/", include("academics.urls")),
    path("api/", include("people.urls")),
    path("api/", include("batches.urls")),
    path("api/", include("attendance.urls")),
    path("api/portal/", include("portal.urls")),
    path("api/", include("dashboard.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
