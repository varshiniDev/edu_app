from django.db import transaction
from rest_framework import serializers
from accounts.models import User
from .models import StaffProfile, StudentProfile
class PersonSerializer(serializers.ModelSerializer):
    ROLE = None; ID_FIELD = None
    user_id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(source="user.first_name", max_length=150)
    email = serializers.EmailField(source="user.email")
    is_active = serializers.BooleanField(source="user.is_active", required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    batches = serializers.SerializerMethodField()
    photo = serializers.ImageField(required=False, allow_null=True)
    remove_photo = serializers.BooleanField(write_only=True, required=False)
    def validate_photo(self, f):
        if f and f.size > 2 * 1024 * 1024: raise serializers.ValidationError("Photo must be 2 MB or smaller.")
        if f and getattr(f, "content_type", "") not in ("image/png", "image/jpeg", "image/webp"):
            raise serializers.ValidationError("Use PNG, JPG or WEBP.")
        return f
    def validate_email(self, v):
        qs = User.objects.filter(email__iexact=v)
        if self.instance: qs = qs.exclude(pk=self.instance.user_id)
        if qs.exists(): raise serializers.ValidationError("This email is already used.")
        return v
    def validate(self, a):
        if not self.instance and not a.get("password"):
            raise serializers.ValidationError({"password": "Password is required."})
        return a
    @transaction.atomic
    def create(self, vd):
        u = vd.pop("user"); pw = vd.pop("password"); vd.pop("remove_photo", None)
        user = User.objects.create_user(username=vd[self.ID_FIELD], email=u["email"], first_name=u["first_name"],
                                        password=pw, role=self.ROLE, is_active=u.get("is_active", True))
        return self.Meta.model.objects.create(user=user, **vd)
    @transaction.atomic
    def update(self, inst, vd):
        u = vd.pop("user", {}); pw = vd.pop("password", None); vd.pop(self.ID_FIELD, None)
        if vd.pop("remove_photo", False):
            vd.pop("photo", None); inst.photo = None
        for k, v in u.items(): setattr(inst.user, k, v)
        if pw: inst.user.set_password(pw)
        inst.user.save()
        for k, v in vd.items(): setattr(inst, k, v)
        inst.save(); return inst
class StaffSerializer(PersonSerializer):
    ROLE = "STAFF"; ID_FIELD = "staff_id"
    class Meta:
        model = StaffProfile
        fields = ["id", "user_id", "staff_id", "full_name", "email", "phone", "designation", "joining_date", "is_active", "password", "batches", "photo", "remove_photo"]
    def get_batches(self, o): return list(o.user.batches.exclude(status="ARCHIVED").values_list("name", flat=True))
class StudentSerializer(PersonSerializer):
    ROLE = "STUDENT"; ID_FIELD = "student_id"
    class Meta:
        model = StudentProfile
        fields = ["id", "user_id", "student_id", "full_name", "email", "phone", "enrollment_date", "is_active", "password", "batches", "photo", "remove_photo"]
    def get_batches(self, o): return list(o.user.enrollments.filter(left_on__isnull=True).values_list("batch__name", flat=True))
