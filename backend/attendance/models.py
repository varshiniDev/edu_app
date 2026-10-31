from django.conf import settings
from django.db import models
U = settings.AUTH_USER_MODEL
STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"]
class Attendance(models.Model):
    batch = models.ForeignKey("batches.Batch", on_delete=models.CASCADE, related_name="attendance")
    student = models.ForeignKey(U, on_delete=models.CASCADE, related_name="attendance")
    date = models.DateField()
    status = models.CharField(max_length=8, choices=[(s, s) for s in STATUSES])
    note = models.CharField(max_length=200, blank=True)
    marked_by = models.ForeignKey(U, null=True, on_delete=models.SET_NULL, related_name="+")
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: unique_together = [("batch", "student", "date")]
class AttendanceAudit(models.Model):
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name="audits")
    old_status = models.CharField(max_length=8, blank=True); new_status = models.CharField(max_length=8)
    changed_by = models.ForeignKey(U, null=True, on_delete=models.SET_NULL, related_name="+")
    changed_at = models.DateTimeField(auto_now_add=True)
