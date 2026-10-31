from datetime import date, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from academics.models import Course
from batches.models import Batch, Enrollment
from people.models import StaffProfile, StudentProfile
SHEET = "/api/portal/attendance/sheet/"
class PortalAccess(TestCase):
    def setUp(self):
        mk = lambda n, r: User.objects.create_user(n, password="x", role=r, first_name=n)
        self.t1, self.t2, self.s1, self.s2 = mk("t1", "STAFF"), mk("t2", "STAFF"), mk("s1", "STUDENT"), mk("s2", "STUDENT")
        for i, t in enumerate((self.t1, self.t2)): StaffProfile.objects.create(user=t, staff_id=f"T{i}", designation="Trainer")
        for i, s in enumerate((self.s1, self.s2)): StudentProfile.objects.create(user=s, student_id=f"S{i}")
        c = Course.objects.create(name="Py", code="PY"); start = date.today() - timedelta(days=30)
        self.b1 = Batch.objects.create(name="B1", course=c, staff=self.t1, start_date=start); self.b2 = Batch.objects.create(name="B2", course=c, staff=self.t2, start_date=start)
        Enrollment.objects.create(batch=self.b1, student=self.s1, enrolled_on=start); Enrollment.objects.create(batch=self.b2, student=self.s2, enrolled_on=start)
    def cl(self, u):
        c = APIClient(); c.force_authenticate(u); return c
    def mark(self, user, batch, d, status="PRESENT", student=None):
        return self.cl(user).post(SHEET, {"batch": batch.id, "date": str(d), "records": [{"student": (student or self.s1).id, "status": status}]}, format="json")
    def test_staff_attendance_rules(self):
        today = date.today()
        self.assertEqual(self.cl(self.t1).get(f"{SHEET}?batch={self.b1.id}&date={today}").data["total"], 1)
        self.assertEqual(self.mark(self.t1, self.b1, today).status_code, 200)
        self.assertEqual(self.mark(self.t1, self.b1, today - timedelta(days=3)).status_code, 200)    # inside the 7-day edit window
        self.assertEqual(self.mark(self.t1, self.b1, today - timedelta(days=20)).status_code, 403)   # older: admin only
        self.assertEqual(self.mark(self.t1, self.b2, today, student=self.s2).status_code, 403)       # another staff's batch
        self.assertEqual(self.mark(self.s1, self.b1, today).status_code, 403)                        # students cannot mark
    def test_student_sees_only_own_attendance(self):
        self.mark(self.t1, self.b1, date.today(), "LATE")
        r = self.cl(self.s1).get(f"/api/portal/my-attendance/?batch={self.b1.id}")
        self.assertEqual((r.data["summary"]["percentage"], r.data["summary"]["LATE"]), (100.0, 1))
        self.assertEqual(self.cl(self.s1).get(f"/api/portal/my-attendance/?batch={self.b2.id}").status_code, 404)
        self.assertEqual(self.cl(self.t1).get(f"/api/portal/students/?batch={self.b1.id}").status_code, 200)
        self.assertEqual(self.cl(self.s1).get(f"/api/portal/students/?batch={self.b1.id}").status_code, 404)  # roster is staff-only
    def test_me_and_role_boundaries(self):
        admin = User.objects.create_user("adm", password="x", role="ADMIN")
        self.assertTrue(self.cl(admin).get("/api/auth/me/").data["is_admin"])
        me = self.cl(self.t1).get("/api/auth/me/").data
        self.assertEqual((me["is_admin"], me["code"], me["designation"]), (False, "T0", "Trainer"))
        self.assertEqual(self.cl(self.s1).get("/api/auth/me/").data["code"], "S0")
        self.assertEqual(self.cl(self.t1).patch("/api/auth/me/", {"remove_photo": "1"}, format="json").status_code, 403)  # photos: admin only
        self.assertEqual(self.cl(self.t1).get("/api/staff/").status_code, 403)
        self.assertEqual(self.cl(self.s1).get("/api/batches/").status_code, 403)
        self.assertEqual([b["name"] for b in self.cl(self.s1).get("/api/portal/batches/").data], ["B1"])
    def test_change_password(self):
        c = self.cl(self.s1)
        self.assertEqual(c.post("/api/portal/change-password/", {"old_password": "wrong", "new_password": "Brand-new-pw-91"}, format="json").status_code, 400)
        self.assertEqual(c.post("/api/portal/change-password/", {"old_password": "x", "new_password": "Brand-new-pw-91"}, format="json").status_code, 200)
