from django.test import TestCase
from rest_framework.test import APIClient
from .models import User
class LoginTests(TestCase):
    def test_id_case_and_email(self):
        User.objects.create_user("T001", email="ravi@x.com", password="Secret@123", role="STAFF")
        c = APIClient(); go = lambda n, p="Secret@123": c.post("/api/auth/login/", {"username": n, "password": p}, format="json").status_code
        self.assertEqual([go("T001"), go("t001"), go(" T001 "), go("ravi@x.com"), go("RAVI@x.com")], [200] * 5)
        self.assertEqual(go("T001", "wrong"), 401)
    def test_inactive_cannot_login(self):
        User.objects.create_user("T002", password="Secret@123", role="STAFF", is_active=False)
        self.assertEqual(APIClient().post("/api/auth/login/", {"username": "T002", "password": "Secret@123"}, format="json").status_code, 401)
