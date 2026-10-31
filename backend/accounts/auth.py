from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
class FlexibleLoginSerializer(TokenObtainPairSerializer):
    """Log in with Staff ID / Student ID / username (any letter case) OR the account email."""
    def validate(self, attrs):
        ident = (attrs.get("username") or "").strip()
        if not User.objects.filter(username=ident).exists():
            for qs in (User.objects.filter(username__iexact=ident), User.objects.filter(email__iexact=ident)):
                if qs.count() == 1: attrs["username"] = qs.first().username; break
        return super().validate(attrs)
class LoginView(TokenObtainPairView):
    serializer_class = FlexibleLoginSerializer
