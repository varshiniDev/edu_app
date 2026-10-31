from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, StudentViewSet
r = DefaultRouter(); r.register("staff", StaffViewSet, basename="staff"); r.register("students", StudentViewSet, basename="students")
urlpatterns = r.urls
