from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import StaffProfile, StudentProfile
from .serializers import StaffSerializer, StudentSerializer
class PersonViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    idf = None
    def blocked(self, o): return None  # return a message to refuse deletion
    def get_queryset(self):
        qs = self.queryset.select_related("user").order_by("user__first_name")
        p = self.request.query_params
        if p.get("search"):
            s = p["search"]; qs = qs.filter(Q(user__first_name__icontains=s) | Q(user__email__icontains=s) | Q(**{f"{self.idf}__icontains": s}))
        if p.get("is_active") in ("true", "false"): qs = qs.filter(user__is_active=p["is_active"] == "true")
        return qs
    def destroy(self, request, *a, **k):
        o = self.get_object(); why = self.blocked(o)
        if why: return Response({"detail": why}, status=400)
        o.user.delete()  # cascades to the profile
        return Response(status=204)
    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        o = self.get_object(); pw = request.data.get("password", "")
        try: validate_password(pw, o.user)
        except ValidationError as e: return Response({"password": e.messages}, status=400)
        o.user.set_password(pw); o.user.save(); return Response({"ok": True})
class StaffViewSet(PersonViewSet):
    queryset = StaffProfile.objects.all(); serializer_class = StaffSerializer; idf = "staff_id"
    def blocked(self, o):
        if o.user.batches.exists(): return "This staff member is assigned to batches. Reassign the batches or deactivate the account instead."
class StudentViewSet(PersonViewSet):
    queryset = StudentProfile.objects.all(); serializer_class = StudentSerializer; idf = "student_id"
    def get_queryset(self):
        qs = super().get_queryset(); b = self.request.query_params.get("batch")
        return qs.filter(user__enrollments__batch_id=b, user__enrollments__left_on__isnull=True) if b else qs
    def blocked(self, o):
        if o.user.enrollments.exists() or o.user.attendance.exists(): return "This student has enrollment/attendance history. Deactivate the account instead."
