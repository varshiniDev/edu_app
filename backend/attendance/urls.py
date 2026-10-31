from django.urls import path
from .views import Sheet, Summary, Export
urlpatterns = [path("attendance/sheet/", Sheet.as_view()), path("attendance/summary/", Summary.as_view()), path("attendance/export/", Export.as_view())]
