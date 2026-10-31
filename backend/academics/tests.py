from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from .models import Course, Topic
class SyllabusTests(TestCase):
    def setUp(self):
        self.u = User.objects.create_user("a", password="x", role="ADMIN")
        self.c = APIClient(); self.c.force_authenticate(self.u)
        self.course = Course.objects.create(name="Py", code="PY")
    def test_cannot_move_under_descendant(self):
        a = Topic.objects.create(course=self.course, title="A")
        b = Topic.objects.create(course=self.course, title="B", parent=a)
        r = self.c.patch(f"/api/topics/{a.id}/", {"parent": b.id}, format="json")
        self.assertEqual(r.status_code, 400)
    def test_student_forbidden(self):
        s = User.objects.create_user("s", password="x", role="STUDENT")
        c = APIClient(); c.force_authenticate(s)
        self.assertEqual(c.get("/api/courses/").status_code, 403)
