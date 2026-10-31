from rest_framework.routers import DefaultRouter
from .views import BatchViewSet
r = DefaultRouter(); r.register("batches", BatchViewSet)
urlpatterns = r.urls
