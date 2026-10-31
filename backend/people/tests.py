from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from academics.models import Course
class Flow(TestCase):
    def setUp(self):
        self.c = APIClient(); self.c.force_authenticate(User.objects.create_user("adm", password="x", role="ADMIN"))
        self.course = Course.objects.create(name="Py", code="PY")
    def person(self, kind, i):
        k = "staff_id" if kind == "staff" else "student_id"
        r = self.c.post(f"/api/{kind}/", {k: i, "full_name": f"N {i}", "email": f"{i}@x.com", "password": "Passw0rd!x"}, format="json")
        self.assertEqual(r.status_code, 201, r.data); return r.data["user_id"]
    def test_full_flow(self):
        t = self.person("staff", "T1"); s1 = self.person("students", "S1"); s2 = self.person("students", "S2")
        self.assertEqual(self.c.post("/api/students/", {"student_id": "S9", "full_name": "D", "email": "S1@x.com", "password": "Passw0rd!x"}, format="json").status_code, 400)
        mk = lambda n, cap: self.c.post("/api/batches/", {"name": n, "course": self.course.id, "staff": t, "start_date": "2026-01-01", "capacity": cap}, format="json")
        b = mk("B1", 1).data["id"]; b2 = mk("B2", 5).data["id"]
        self.assertEqual(self.c.post(f"/api/batches/{b}/enrollments/", {"students": [s1]}, format="json").status_code, 201)
        self.assertEqual(self.c.post(f"/api/batches/{b}/enrollments/", {"students": [s1]}, format="json").status_code, 400)  # duplicate
        self.assertEqual(self.c.post(f"/api/batches/{b}/enrollments/", {"students": [s2]}, format="json").status_code, 400)  # full
        today = str(date.today())
        r = self.c.post("/api/attendance/sheet/", {"batch": b, "date": today, "records": [{"student": s1, "status": "PRESENT"}]}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.c.post("/api/attendance/sheet/", {"batch": b, "date": today, "records": [{"student": s2, "status": "PRESENT"}]}, format="json").status_code, 400)
        self.assertEqual(self.c.post("/api/attendance/sheet/", {"batch": b, "date": "2999-01-01", "records": []}, format="json").status_code, 400)
        self.c.post("/api/attendance/sheet/", {"batch": b, "date": today, "records": [{"student": s1, "status": "ABSENT"}]}, format="json")
        from attendance.models import AttendanceAudit; self.assertEqual(AttendanceAudit.objects.count(), 2)  # create + correction
        self.assertEqual(self.c.get(f"/api/attendance/summary/?batch={b}").data["rows"][0]["ABSENT"], 1)
        self.assertEqual(self.c.post(f"/api/batches/{b}/transfer/", {"student": s1, "to_batch": b2}, format="json").status_code, 200)
        self.assertEqual(len(self.c.get(f"/api/batches/{b}/enrollments/").data), 1)  # history kept
        self.assertEqual(self.c.get(f"/api/batches/{b}/enrollments/?active=true").data, [])
class PhotoDelete(TestCase):
    def test_photo_and_delete(self):
        import io, tempfile
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test import override_settings
        c = APIClient(); c.force_authenticate(User.objects.create_user("adm", password="x", role="ADMIN"))
        buf = io.BytesIO(); Image.new("RGB", (10, 10), "red").save(buf, "PNG")
        with override_settings(MEDIA_ROOT=tempfile.mkdtemp()):
            img = SimpleUploadedFile("a.png", buf.getvalue(), content_type="image/png")
            r = c.post("/api/staff/", {"staff_id": "T1", "full_name": "A", "email": "a@x.com", "password": "Passw0rd!x", "is_active": "true", "photo": img}, format="multipart")
            self.assertEqual(r.status_code, 201, r.data); self.assertIn("/media/people/", r.data["photo"]); pid = r.data["id"]
            r = c.patch(f"/api/staff/{pid}/", {"remove_photo": "1", "full_name": "B"}, format="multipart")
            self.assertIsNone(r.data["photo"]); self.assertEqual(r.data["full_name"], "B"); self.assertTrue(r.data["is_active"])
            self.assertEqual(c.delete(f"/api/staff/{pid}/").status_code, 204)
            self.assertFalse(User.objects.filter(username="T1").exists())
