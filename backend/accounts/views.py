from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Branding
from .permissions import IsAdminRole
MAX_LOGO = 2 * 1024 * 1024
def branding_data(request):
    b = Branding.get()
    url = request.build_absolute_uri(b.logo.url) + f"?v={int(b.updated_at.timestamp())}" if b.logo else None
    return {"academy_name": b.academy_name, "logo_url": url}
def check_image(f):
    if f.size > MAX_LOGO: return "Max size is 2 MB"
    if f.content_type not in ("image/png", "image/jpeg", "image/webp"): return "Use PNG, JPG or WEBP"
    try:
        from PIL import Image
        Image.open(f).verify(); f.seek(0)
    except Exception: return "Invalid image file"
def me_photo(u):
    for rel in ("staff_profile", "student_profile"):
        p = getattr(u, rel, None)
        if p is not None and p.photo: return p.photo
    return u.photo or None
def me_data(request):
    """Profile for ANY role. The web/mobile apps use is_admin to choose the admin UI or the portal UI."""
    u = request.user; ph = me_photo(u); sp = getattr(u, "staff_profile", None); st = getattr(u, "student_profile", None); p = sp or st
    return {"id": u.id, "username": u.username, "email": u.email, "role": u.role, "name": u.get_full_name() or u.username,
            "photo": request.build_absolute_uri(ph.url) if ph else None, "is_admin": bool(u.is_superuser or u.role == "ADMIN"),
            "code": (sp.staff_id if sp else st.student_id if st else None), "phone": p.phone if p else "",
            "designation": sp.designation if sp else "", "joined": (sp.joining_date if sp else st.enrollment_date if st else None)}
class MeView(APIView):
    def get_permissions(self):  # anyone logged in can read their own profile; only admins can change photos
        return [IsAuthenticated()] if self.request.method == "GET" else [IsAdminRole()]
    def get(self, request): return Response(me_data(request))
    def patch(self, request):
        u = request.user; f = request.FILES.get("photo")
        if f:
            e = check_image(f)
            if e: return Response({"photo": e}, status=400)
            u.photo = f
        if request.data.get("remove_photo") in ("1", "true", True): u.photo = None
        u.save(); return Response(me_data(request))
class BrandingView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAdminRole()]
    def get(self, request):
        return Response(branding_data(request))
    def patch(self, request):
        b = Branding.get()
        if "academy_name" in request.data:
            name = str(request.data["academy_name"]).strip()
            if not name:
                return Response({"academy_name": "Required"}, status=400)
            b.academy_name = name[:120]
        f = request.FILES.get("logo")
        if f:
            if f.size > MAX_LOGO:
                return Response({"logo": "Max size is 2 MB"}, status=400)
            if f.content_type not in ("image/png", "image/jpeg", "image/webp"):
                return Response({"logo": "Use PNG, JPG or WEBP"}, status=400)
            b.logo = f
        if request.data.get("remove_logo") in ("1", "true", True):
            b.logo = None
        try:
            b.full_clean(); b.save()
        except Exception as e:
            return Response({"logo": "Invalid image file"}, status=400)
        return Response(branding_data(request))
