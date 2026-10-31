from django.urls import path
from .views import MeView, BrandingView
urlpatterns = [path("auth/me/", MeView.as_view()), path("branding/", BrandingView.as_view())]
