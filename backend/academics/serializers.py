from django.core.exceptions import ValidationError as DjVE
from rest_framework import serializers
from .models import Course, Topic
class CourseSerializer(serializers.ModelSerializer):
    topic_count = serializers.IntegerField(source="topics.count", read_only=True)
    class Meta:
        model = Course
        fields = ["id", "name", "code", "description", "duration_weeks", "status", "created_at", "topic_count"]
class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["id", "course", "parent", "title", "description", "order", "estimated_minutes", "is_active"]
        read_only_fields = ["course"]
    def validate(self, attrs):
        t = self.instance or Topic(course=self.context["course"])
        for k, v in attrs.items(): setattr(t, k, v)
        try: t.clean()
        except DjVE as e: raise serializers.ValidationError(e.messages)
        return attrs
