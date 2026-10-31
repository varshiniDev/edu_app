from rest_framework import serializers
from .models import Batch, Enrollment
DAYS = {"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"}
class BatchSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    staff_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()
    online_count = serializers.SerializerMethodField()
    offline_count = serializers.SerializerMethodField()
    class Meta:
        model = Batch
        fields = ["id", "name", "course", "course_name", "staff", "staff_name", "start_date", "end_date", "class_days",
                  "start_time", "end_time", "capacity", "status", "enrolled_count", "online_count", "offline_count", "meet_link"]
    def get_staff_name(self, o): return (o.staff.get_full_name() or o.staff.username) if o.staff else None
    def get_enrolled_count(self, o): return o.enrollments.filter(left_on__isnull=True).count()
    def get_online_count(self, o): return o.enrollments.filter(left_on__isnull=True, mode="ONLINE").count()
    def get_offline_count(self, o): return o.enrollments.filter(left_on__isnull=True, mode="OFFLINE").count()
    def validate_meet_link(self, v):
        if v and not v.startswith("https://"): raise serializers.ValidationError("Link must start with https://")
        return v
    def validate_staff(self, u):
        if u and (u.role != "STAFF" or not u.is_active): raise serializers.ValidationError("Choose an active staff member.")
        return u
    def validate_class_days(self, v):
        d = [x.strip().upper() for x in v.split(",") if x.strip()]
        if set(d) - DAYS: raise serializers.ValidationError("Use MON,TUE,WED,THU,FRI,SAT,SUN.")
        return ",".join(d)
    def validate(self, a):
        g = lambda k: a.get(k, getattr(self.instance, k, None))
        if g("end_date") and g("end_date") < g("start_date"): raise serializers.ValidationError({"end_date": "End date is before start date."})
        if g("start_time") and g("end_time") and g("end_time") <= g("start_time"): raise serializers.ValidationError({"end_time": "End time must be after start time."})
        if self.instance and "capacity" in a and a["capacity"] < self.get_enrolled_count(self.instance):
            raise serializers.ValidationError({"capacity": "Capacity is below current enrollment."})
        return a
class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    student_code = serializers.CharField(source="student.student_profile.student_id", read_only=True)
    student_photo = serializers.SerializerMethodField()
    def get_student_photo(self, o):
        p = o.student.student_profile.photo; r = self.context.get("request")
        return (r.build_absolute_uri(p.url) if r else p.url) if p else None
    class Meta:
        model = Enrollment
        fields = ["id", "student", "student_name", "student_code", "student_photo", "enrolled_on", "left_on", "status", "note", "mode"]
