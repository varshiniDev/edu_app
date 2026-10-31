from django.contrib.auth.models import AbstractUser
from django.db import models
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN"; STAFF = "STAFF"; STUDENT = "STUDENT"
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    photo = models.ImageField(upload_to="avatars/", null=True, blank=True)
    def save(self, *a, **k):
        if self.is_superuser: self.role = self.Role.ADMIN   # `createsuperuser` must never produce a "student"
        super().save(*a, **k)
class Branding(models.Model):
    """Single-row table: academy name + logo shared by web and mobile."""
    academy_name = models.CharField(max_length=120, default="My Academy")
    logo = models.ImageField(upload_to="branding/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    @classmethod
    def get(cls):
        return cls.objects.first() or cls.objects.create()