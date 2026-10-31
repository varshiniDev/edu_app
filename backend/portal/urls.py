from django.urls import path
from . import views as v
urlpatterns = [path("live-classes/", v.LiveClasses.as_view()), path("schedule/", v.Schedule.as_view()), path("batches/", v.MyBatches.as_view()), path("students/", v.MyStudents.as_view()),
               path("attendance/sheet/", v.StaffSheet.as_view()), path("my-attendance/", v.MyAttendance.as_view()), path("recordings/", v.Recordings.as_view()),
               path("materials/", v.Materials.as_view()), path("change-password/", v.ChangePassword.as_view())]
