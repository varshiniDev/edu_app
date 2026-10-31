import csv
from datetime import date
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from batches.models import Batch, Enrollment
from .models import Attendance, AttendanceAudit, STATUSES
def parse(s, default=None):
    try: return date.fromisoformat(s)
    except (TypeError, ValueError): return default
def enrolled_on(batch, d):
    return Enrollment.objects.filter(batch=batch, enrolled_on__lte=d).filter(Q(left_on__isnull=True) | Q(left_on__gte=d)).select_related("student__student_profile").order_by("student__first_name")
class Sheet(APIView):
    """GET sheet for batch+date; POST bulk mark/correct (audited)."""
    def get(self, request):
        b = Batch.objects.filter(pk=request.query_params.get("batch")).first(); d = parse(request.query_params.get("date"))
        if not b or not d: return Response({"detail": "batch and date (YYYY-MM-DD) are required."}, status=400)
        marks = {a.student_id: a for a in Attendance.objects.filter(batch=b, date=d)}
        rows = [{"student": e.student_id, "student_code": e.student.student_profile.student_id, "name": e.student.get_full_name(),
                 "status": marks[e.student_id].status if e.student_id in marks else None,
                 "note": marks[e.student_id].note if e.student_id in marks else ""} for e in enrolled_on(b, d)]
        return Response({"batch": b.id, "date": d, "staff": b.staff.get_full_name() if b.staff else None, "rows": rows,
                         "marked": sum(1 for r in rows if r["status"]), "total": len(rows)})
    @transaction.atomic
    def post(self, request):
        b = Batch.objects.filter(pk=request.data.get("batch")).first(); d = parse(request.data.get("date"))
        if not b or not d: return Response({"detail": "batch and date are required."}, status=400)
        if d > date.today(): return Response({"detail": "Cannot mark attendance for a future date."}, status=400)
        if d < b.start_date: return Response({"detail": "Date is before the batch start date."}, status=400)
        valid = {e.student_id for e in enrolled_on(b, d)}; changed = 0
        for r in request.data.get("records", []):
            if r.get("student") not in valid: return Response({"detail": f"Student {r.get('student')} was not enrolled on {d}."}, status=400)
            if r.get("status") not in STATUSES: return Response({"detail": f"Invalid status: {r.get('status')}"}, status=400)
            a, created = Attendance.objects.get_or_create(batch=b, student_id=r["student"], date=d,
                                                          defaults={"status": r["status"], "note": r.get("note", ""), "marked_by": request.user})
            if created: AttendanceAudit.objects.create(attendance=a, new_status=a.status, changed_by=request.user); changed += 1
            elif a.status != r["status"] or a.note != r.get("note", a.note):
                AttendanceAudit.objects.create(attendance=a, old_status=a.status, new_status=r["status"], changed_by=request.user)
                a.status = r["status"]; a.note = r.get("note", a.note); a.marked_by = request.user; a.save(); changed += 1
        return Response({"saved": changed})
def summary_rows(batch, d1, d2):
    out = {}
    for a in Attendance.objects.filter(batch=batch, date__range=(d1, d2)).select_related("student__student_profile"):
        r = out.setdefault(a.student_id, {"student": a.student_id, "student_code": a.student.student_profile.student_id,
                           "name": a.student.get_full_name(), **{s: 0 for s in STATUSES}})
        r[a.status] += 1
    for r in out.values():
        total = sum(r[s] for s in STATUSES); r["marked"] = total
        r["percentage"] = round((r["PRESENT"] + r["LATE"]) * 100 / total, 1) if total else None
    return sorted(out.values(), key=lambda r: r["name"])
def get_range(request):
    b = Batch.objects.filter(pk=request.query_params.get("batch")).first()
    return b, parse(request.query_params.get("from"), date(2000, 1, 1)), parse(request.query_params.get("to"), date.today())
class Summary(APIView):
    def get(self, request):
        b, d1, d2 = get_range(request)
        if not b: return Response({"detail": "batch is required."}, status=400)
        rows = summary_rows(b, d1, d2); marked = sum(r["marked"] for r in rows); good = sum(r["PRESENT"] + r["LATE"] for r in rows)
        return Response({"rows": rows, "overall_percentage": round(good * 100 / marked, 1) if marked else None})
class Export(APIView):
    def get(self, request):
        b, d1, d2 = get_range(request)
        if not b: return Response({"detail": "batch is required."}, status=400)
        resp = HttpResponse(content_type="text/csv"); resp["Content-Disposition"] = f'attachment; filename="attendance_{b.id}.csv"'
        w = csv.writer(resp); w.writerow(["Student ID", "Name", "Present", "Absent", "Late", "Leave", "Marked", "Percentage"])
        for r in summary_rows(b, d1, d2):
            w.writerow([r["student_code"], r["name"], r["PRESENT"], r["ABSENT"], r["LATE"], r["LEAVE"], r["marked"], r["percentage"] if r["percentage"] is not None else ""])
        return resp
