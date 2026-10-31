from django.conf import settings
from django.db import models
from django.db.models import Q
U = settings.AUTH_USER_MODEL
class Batch(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE"; COMPLETED = "COMPLETED"; ARCHIVED = "ARCHIVED"
    name = models.CharField(max_length=120, unique=True)
    course = models.ForeignKey("academics.Course", on_delete=models.PROTECT, related_name="batches")
    staff = models.ForeignKey(U, null=True, blank=True, on_delete=models.SET_NULL, related_name="batches", limit_choices_to={"role": "STAFF"})
    start_date = models.DateField(); end_date = models.DateField(null=True, blank=True)
    class_days = models.CharField(max_length=30, blank=True)  # e.g. "MON,WED,FRI"
    start_time = models.TimeField(null=True, blank=True); end_time = models.TimeField(null=True, blank=True)
    capacity = models.PositiveIntegerField(default=30)
    meet_link = models.URLField(max_length=300, blank=True)  # Google Meet link, replaceable
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
class Enrollment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE"; TRANSFERRED = "TRANSFERRED"; LEFT = "LEFT"
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(U, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_on = models.DateField()
    left_on = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    note = models.CharField(max_length=200, blank=True)
    mode = models.CharField(max_length=7, choices=[("ONLINE", "Online"), ("OFFLINE", "Offline")], default="OFFLINE")
    class Meta:
        constraints = [models.UniqueConstraint(fields=["batch", "student"], condition=Q(left_on__isnull=True), name="one_active_enrollment_per_batch")]

class ClassRecording(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name="recordings")
    date = models.DateField()
    title = models.CharField(max_length=150, blank=True)
    url = models.URLField(max_length=500)  # e.g. Google Drive link of the Meet recording
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: unique_together = [("batch", "date")]
