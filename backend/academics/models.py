from django.db import models
from django.core.exceptions import ValidationError
class Course(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE"; ARCHIVED = "ARCHIVED"
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)
    duration_weeks = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name
class Topic(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="topics")
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="children")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    estimated_minutes = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ["order", "id"]
    def clean(self):
        if self.parent_id:
            if self.parent.course_id != self.course_id:
                raise ValidationError("Parent must belong to the same course.")
            if self.pk:
                p = self.parent
                while p:
                    if p.pk == self.pk:
                        raise ValidationError("A topic cannot be moved under itself or its descendants.")
                    p = p.parent

class TopicMaterial(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="materials")
    title = models.CharField(max_length=120)
    file = models.FileField(upload_to="materials/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["id"]
