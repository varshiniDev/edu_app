import io, tempfile
from datetime import date, datetime, timedelta, time
from unittest import mock
from zoneinfo import ZoneInfo
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from accounts.models import User
from academics.models import Course, Topic
from .models import Batch, Enrollment
from .utils import WD
NOW = datetime(2026, 10, 28, 10, 5, tzinfo=ZoneInfo("Asia/Kolkata"))  # a Wednesday
class Features(TestCase):
    def setUp(self):
        self.admin = APIClient(); self.admin.force_authenticate(User.objects.create_user("adm", password="x", role="ADMIN"))
        self.staff = User.objects.create_user("t1", password="x", role="STAFF", first_name="T")
        self.on = User.objects.create_user("s1", password="x", role="STUDENT", first_name="On")
        self.off = User.objects.create_user("s2", password="x", role="STUDENT", first_name="Off")
        self.course = Course.objects.create(name="Py", code="PY")
        self.b = Batch.objects.create(name="B", course=self.course, staff=self.staff, start_date=date(2026, 10, 1), class_days=WD[NOW.weekday()],
                                      start_time=time(10, 0), end_time=time(11, 0), meet_link="https://meet.google.com/abc-defg-hij")
        Enrollment.objects.create(batch=self.b, student=self.on, enrolled_on=date(2026, 10, 1), mode="ONLINE")
        Enrollment.objects.create(batch=self.b, student=self.off, enrolled_on=date(2026, 10, 1), mode="OFFLINE")
    def link_for(self, user, now):
        c = APIClient(); c.force_authenticate(user)
        with mock.patch("portal.views.timezone.localtime", return_value=now):
            r = c.get("/api/portal/live-classes/")
        return r.data[0]["meet_link"] if r.data else "none"
    def test_link_window_and_mode(self):
        link = self.b.meet_link
        self.assertEqual(self.link_for(self.on, NOW), link); self.assertEqual(self.link_for(self.staff, NOW), link)
        self.assertIsNone(self.link_for(self.off, NOW))                                   # offline student: no link
        self.assertIsNone(self.link_for(self.on, NOW.replace(hour=9, minute=40)))         # too early
        self.assertEqual(self.link_for(self.on, NOW.replace(hour=9, minute=55)), link)    # 10 min before start
        self.assertIsNone(self.link_for(self.on, NOW.replace(hour=11, minute=1)))         # class ended
        self.b.meet_link = "https://meet.google.com/new-link-xyz"; self.b.save()           # replaced link is used
        self.assertEqual(self.link_for(self.on, NOW), "https://meet.google.com/new-link-xyz")
    def test_portal_isolation(self):
        other = User.objects.create_user("s3", password="x", role="STUDENT"); c = APIClient(); c.force_authenticate(other)
        self.assertEqual(c.get(f"/api/portal/recordings/?batch={self.b.id}").status_code, 404)
        self.assertEqual(c.get("/api/courses/").status_code, 403)
    def test_recordings(self):
        b = Batch.objects.create(name="R", course=self.course, start_date=date.today() - timedelta(days=3))
        self.assertGreaterEqual(len(self.admin.get(f"/api/batches/{b.id}/recordings/").data), 4)
        d = str(date.today())
        self.assertEqual(self.admin.post(f"/api/batches/{b.id}/recordings/", {"date": d, "url": "http://x"}, format="json").status_code, 400)
        self.assertEqual(self.admin.post(f"/api/batches/{b.id}/recordings/", {"date": d, "url": "https://drive.google.com/a"}, format="json").status_code, 201)
        self.assertEqual(self.admin.post(f"/api/batches/{b.id}/recordings/", {"date": d, "url": "https://drive.google.com/b"}, format="json").status_code, 201)  # replace
        self.assertEqual(self.admin.get(f"/api/batches/{b.id}/recordings/").data[0]["url"], "https://drive.google.com/b")
    def test_mode_change(self):
        r = self.admin.post(f"/api/batches/{self.b.id}/mode/", {"student": self.off.id, "mode": "ONLINE"}, format="json")
        self.assertEqual(r.status_code, 200); self.assertEqual(self.admin.get(f"/api/batches/{self.b.id}/").data["online_count"], 2)
    def test_pdf_materials(self):
        t = Topic.objects.create(course=self.course, title="T")
        with override_settings(MEDIA_ROOT=tempfile.mkdtemp()):
            ok = SimpleUploadedFile("a.pdf", b"%PDF-1.4 test", content_type="application/pdf")
            self.assertEqual(self.admin.post(f"/api/topics/{t.id}/materials/", {"title": "Notes", "file": ok}, format="multipart").status_code, 201)
            bad = SimpleUploadedFile("a.pdf", b"not a pdf", content_type="application/pdf")
            self.assertEqual(self.admin.post(f"/api/topics/{t.id}/materials/", {"file": bad}, format="multipart").status_code, 400)
            tree = self.admin.get(f"/api/courses/{self.course.id}/topics/").data
            self.assertEqual(tree[0]["materials"][0]["title"], "Notes")
    def test_course_delete_blocked(self):
        self.assertEqual(self.admin.delete(f"/api/courses/{self.course.id}/").status_code, 400)
