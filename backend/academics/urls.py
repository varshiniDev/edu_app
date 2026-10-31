from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, TopicViewSet, MaterialViewSet
r = DefaultRouter(); r.register("courses", CourseViewSet); r.register("topics", TopicViewSet); r.register("materials", MaterialViewSet)
urlpatterns = r.urls
