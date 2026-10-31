from datetime import date
from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from academics.models import Course, Topic
from batches.models import Batch
from people.models import StaffProfile, StudentProfile
from attendance.models import Attendance
class Summary(APIView):
    def get(self, request):
        t = Attendance.objects.filter(date=date.today()); n = t.count(); good = t.filter(status__in=["PRESENT", "LATE"]).count()
        return Response({"students": StudentProfile.objects.filter(user__is_active=True).count(),
          "staff": StaffProfile.objects.filter(user__is_active=True).count(),
          "courses": Course.objects.filter(status="ACTIVE").count(), "topics": Topic.objects.count(),
          "batches": Batch.objects.filter(status="ACTIVE").count(),
          "attendance_today": round(good * 100 / n, 1) if n else None})
urlpatterns = [path("dashboard/summary/", Summary.as_view())]