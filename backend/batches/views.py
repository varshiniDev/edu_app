from datetime import date
from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.models import User
from .models import Batch, Enrollment, ClassRecording
from .utils import recording_days
from django.utils import timezone
from .serializers import BatchSerializer, EnrollmentSerializer
def enroll(batch, student_id, note="", mode="OFFLINE"):
    """Returns error string or None. Caller must be inside a transaction."""
    if batch.status != "ACTIVE": return "Batch is not active."
    st = User.objects.filter(pk=student_id, role="STUDENT", is_active=True).first()
    if not st: return f"Student {student_id} not found or inactive."
    if batch.enrollments.filter(student=st, left_on__isnull=True).exists(): return f"{st.get_full_name()} is already enrolled."
    if batch.enrollments.filter(left_on__isnull=True).count() >= batch.capacity: return "Batch is full."
    Enrollment.objects.create(batch=batch, student=st, enrolled_on=date.today(), note=note, mode=mode); return None
class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related("course", "staff").order_by("-start_date", "name")
    serializer_class = BatchSerializer
    def get_queryset(self):
        qs = super().get_queryset(); p = self.request.query_params
        for k in ("staff", "course", "status"):
            if p.get(k): qs = qs.filter(**{k if k == "status" else f"{k}_id": p[k]})
        if p.get("search"): qs = qs.filter(name__icontains=p["search"])
        return qs
    def destroy(self, request, *a, **k):
        b = self.get_object()
        if b.enrollments.exists(): return Response({"detail": "Batch has enrollment history. Archive it instead."}, status=400)
        return super().destroy(request, *a, **k)
    @action(detail=True, methods=["get", "post"])
    def enrollments(self, request, pk=None):
        b = self.get_object()
        if request.method == "GET":
            qs = b.enrollments.select_related("student__student_profile").order_by("left_on", "student__first_name")
            if request.query_params.get("active") == "true": qs = qs.filter(left_on__isnull=True)
            return Response(EnrollmentSerializer(qs, many=True, context={"request": request}).data)
        ids = request.data.get("students", [])
        if not ids: return Response({"detail": "Select at least one student."}, status=400)
        mode = request.data.get("mode", "OFFLINE")
        if mode not in ("ONLINE", "OFFLINE"): return Response({"detail": "Mode must be ONLINE or OFFLINE."}, status=400)
        errors = []
        with transaction.atomic():
            for i in ids:
                e = enroll(b, i, mode=mode)
                if e: errors.append(e)
            if errors: transaction.set_rollback(True)
        return Response({"errors": errors}, status=400) if errors else Response({"enrolled": len(ids)}, status=201)
    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        b = self.get_object()
        n = b.enrollments.filter(student_id=request.data.get("student"), left_on__isnull=True).update(left_on=date.today(), status="LEFT")
        return Response({"updated": n}) if n else Response({"detail": "No active enrollment."}, status=400)
    @action(detail=True, methods=["post"])
    def transfer(self, request, pk=None):
        src = self.get_object(); dst = Batch.objects.filter(pk=request.data.get("to_batch")).first(); sid = request.data.get("student")
        if not dst or dst.pk == src.pk: return Response({"detail": "Choose a different target batch."}, status=400)
        if dst.course_id != src.course_id: return Response({"detail": "Target batch must be the same course."}, status=400)
        with transaction.atomic():
            cur = src.enrollments.filter(student_id=sid, left_on__isnull=True).first()
            if not cur: return Response({"detail": "Student is not actively enrolled here."}, status=400)
            e = enroll(dst, sid, note=f"Transferred from {src.name}", mode=cur.mode)
            if e: transaction.set_rollback(True); return Response({"detail": e}, status=400)
            cur.left_on = date.today(); cur.status = "TRANSFERRED"; cur.note = f"Transferred to {dst.name}"; cur.save()
        return Response({"ok": True})

    @action(detail=True, methods=["post"], url_path="mode")
    def set_mode(self, request, pk=None):
        mode = request.data.get("mode")
        if mode not in ("ONLINE", "OFFLINE"): return Response({"detail": "Mode must be ONLINE or OFFLINE."}, status=400)
        n = self.get_object().enrollments.filter(student_id=request.data.get("student"), left_on__isnull=True).update(mode=mode)
        return Response({"updated": n}) if n else Response({"detail": "No active enrollment."}, status=400)
    @action(detail=True, methods=["get", "post", "delete"])
    def recordings(self, request, pk=None):
        b = self.get_object()
        if request.method == "GET": return Response(recording_days(b))
        try: d = date.fromisoformat(str(request.data.get("date") or request.query_params.get("date")))
        except ValueError: return Response({"detail": "A valid date is required."}, status=400)
        if d < b.start_date or d > timezone.localdate(): return Response({"detail": "Date must be between the batch start date and today."}, status=400)
        if request.method == "DELETE":
            b.recordings.filter(date=d).delete(); return Response(status=204)
        url = (request.data.get("url") or "").strip()
        if not url.startswith("https://") or len(url) > 500: return Response({"url": "Enter a valid https:// link."}, status=400)
        ClassRecording.objects.update_or_create(batch=b, date=d, defaults={"url": url, "title": (request.data.get("title") or "")[:150]})
        return Response({"ok": True}, status=201)
