"""API for the Staff & Student portals. Any logged-in user; every query is limited to that user's own batches."""
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from academics.views import build_tree
from attendance.models import Attendance, STATUSES
from attendance.views import Sheet, parse
from batches.models import Batch, Enrollment
from batches.utils import live_state, recording_days, runs_on, WD
LIVE_ONLY, ALL_OPEN = ("ACTIVE",), ("ACTIVE", "COMPLETED")
def my_batches(u, statuses=LIVE_ONLY):
    """List of (batch, mode). Mode only applies to students."""
    if u.is_superuser or u.role == "ADMIN": return [(b, None) for b in Batch.objects.filter(status__in=statuses).select_related("course", "staff")]
    if u.role == "STAFF": return [(b, None) for b in Batch.objects.filter(staff=u, status__in=statuses).select_related("course", "staff")]
    if u.role == "STUDENT":
        return [(e.batch, e.mode) for e in Enrollment.objects.filter(student=u, left_on__isnull=True, batch__status__in=statuses).select_related("batch__course", "batch__staff")]
    return []
def get_batch(request, statuses=ALL_OPEN):
    bid = request.query_params.get("batch")
    return next((b for b, _ in my_batches(request.user, statuses) if str(b.id) == str(bid)), None)
def photo_url(request, f): return request.build_absolute_uri(f.url) if f else None
class LiveClasses(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        now = timezone.localtime(); out = []
        for b, mode in my_batches(request.user):
            s = live_state(b, now)
            if not s["scheduled"]: continue
            show = s["is_open"] and bool(b.meet_link) and mode != "OFFLINE"   # offline students attend in person
            state = "ended" if now > s["ends_at"] else "live" if now >= s["starts_at"] else "starting" if s["is_open"] else "upcoming"
            out.append({"batch": b.id, "name": b.name, "course": b.course.name, "starts_at": s["starts_at"], "ends_at": s["ends_at"], "state": state,
                        "is_open": s["is_open"], "mode": mode, "meet_link": b.meet_link if show else None,
                        "note": "Offline class: attend at the academy." if mode == "OFFLINE" else None})
        return Response(sorted(out, key=lambda x: x["starts_at"]))
class Schedule(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        today = timezone.localdate(); out = []
        for b, mode in my_batches(request.user):
            if not (b.start_time and b.end_time): continue
            for i in range(7):
                d = today + timedelta(days=i)
                if d < b.start_date or (b.end_date and d > b.end_date) or not runs_on(b, d): continue
                out.append({"date": d, "weekday": WD[d.weekday()], "batch": b.id, "name": b.name, "course": b.course.name, "start_time": b.start_time, "end_time": b.end_time, "mode": mode})
        return Response(sorted(out, key=lambda x: (x["date"], x["start_time"])))
class MyBatches(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        staff = request.user.role == "STAFF"
        return Response([{"id": b.id, "name": b.name, "course": b.course.name, "status": b.status, "staff": (b.staff.get_full_name() or b.staff.username) if b.staff else None,
                          "class_days": b.class_days, "start_time": b.start_time, "end_time": b.end_time, "start_date": b.start_date, "end_date": b.end_date, "mode": mode,
                          "students": b.enrollments.filter(left_on__isnull=True).count() if staff else None}
                         for b, mode in my_batches(request.user, ALL_OPEN)])
class MyStudents(APIView):
    """Staff only: active students of one of their own batches (no email/phone shown)."""
    permission_classes = [IsAuthenticated]
    def get(self, request):
        b = get_batch(request)
        if not b or request.user.role != "STAFF": return Response({"detail": "Not found."}, status=404)
        rows = Enrollment.objects.filter(batch=b, left_on__isnull=True).select_related("student__student_profile").order_by("student__first_name")
        return Response([{"student": e.student_id, "code": e.student.student_profile.student_id, "name": e.student.get_full_name(), "mode": e.mode,
                          "photo": photo_url(request, e.student.student_profile.photo)} for e in rows])
class StaffSheet(Sheet):
    """Same attendance sheet as the admin, but a staff member may only touch their own batches and recent dates."""
    permission_classes = [IsAuthenticated]
    def guard(self, request, bid):
        b = Batch.objects.filter(pk=bid).first()
        if not b or request.user.role != "STAFF" or b.staff_id != request.user.id:
            return Response({"detail": "You can only manage attendance for your own batches."}, status=403)
    def get(self, request): return self.guard(request, request.query_params.get("batch")) or super().get(request)
    def post(self, request):
        r = self.guard(request, request.data.get("batch"))
        if r: return r
        d = parse(request.data.get("date"))
        if d and d < timezone.localdate() - timedelta(days=settings.STAFF_ATTENDANCE_EDIT_DAYS):
            return Response({"detail": f"Staff can only edit the last {settings.STAFF_ATTENDANCE_EDIT_DAYS} days. Ask the admin for older corrections."}, status=403)
        return super().post(request)
class MyAttendance(APIView):
    """Student only: own attendance in one batch."""
    permission_classes = [IsAuthenticated]
    def get(self, request):
        b = get_batch(request)
        if not b or request.user.role != "STUDENT": return Response({"detail": "Not found."}, status=404)
        recs = Attendance.objects.filter(batch=b, student=request.user).order_by("-date"); c = {s: 0 for s in STATUSES}
        for r in recs: c[r.status] += 1
        n = sum(c.values())
        return Response({"summary": {**c, "marked": n, "percentage": round((c["PRESENT"] + c["LATE"]) * 100 / n, 1) if n else None}, "records": [{"date": r.date, "status": r.status} for r in recs]})
class Recordings(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        b = get_batch(request)
        return Response([r for r in recording_days(b) if r["url"]]) if b else Response({"detail": "Not found."}, status=404)
class Materials(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        b = get_batch(request)
        return Response(build_tree(b.course.topics.prefetch_related("materials"), request)) if b else Response({"detail": "Not found."}, status=404)
class ChangePassword(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        u = request.user; new = request.data.get("new_password", "")
        if not u.check_password(request.data.get("old_password", "")): return Response({"old_password": "Current password is incorrect."}, status=400)
        try: validate_password(new, u)
        except ValidationError as e: return Response({"new_password": e.messages}, status=400)
        u.set_password(new); u.save(); return Response({"ok": True})
