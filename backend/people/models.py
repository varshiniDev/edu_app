from django.conf import settings
from django.db import models
class StaffProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile")
    staff_id = models.CharField(max_length=30, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to="people/", null=True, blank=True)
class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile")
    student_id = models.CharField(max_length=30, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    enrollment_date = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to="people/", null=True, blank=True)
