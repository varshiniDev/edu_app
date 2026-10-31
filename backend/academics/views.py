from django.db import transaction
from django.db.models import ProtectedError
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, Topic, TopicMaterial
from .serializers import CourseSerializer, TopicSerializer
def materials_of(t, request):
    return [{"id": m.id, "title": m.title, "url": request.build_absolute_uri(m.file.url) if request else m.file.url} for m in t.materials.all()]
def build_tree(topics, request=None):
    nodes = {t.id: {"id": t.id, "parent": t.parent_id, "title": t.title, "description": t.description,
                    "order": t.order, "estimated_minutes": t.estimated_minutes, "children": [],
                    "materials": materials_of(t, request)} for t in topics}
    roots = []
    for n in nodes.values():
        (nodes[n["parent"]]["children"] if n["parent"] else roots).append(n)
    def number(items, prefix=""):
        for i, n in enumerate(items, 1):
            n["number"] = f"{prefix}{i}"; number(n["children"], f"{prefix}{i}.")
    number(roots)
    return roots
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("name")
    serializer_class = CourseSerializer
    search_fields = ["name", "code"]
    def get_queryset(self):
        qs = super().get_queryset(); q = self.request.query_params.get("search")
        return qs.filter(name__icontains=q) if q else qs
    def destroy(self, request, *a, **k):
        try: return super().destroy(request, *a, **k)
        except ProtectedError: return Response({"detail": "This course has batches. Archive it instead."}, status=400)
    @action(detail=True, methods=["get", "post"])
    def topics(self, request, pk=None):
        course = self.get_object()
        if request.method == "GET":
            return Response(build_tree(course.topics.prefetch_related("materials"), request))
        s = TopicSerializer(data=request.data, context={"course": course}); s.is_valid(raise_exception=True)
        with transaction.atomic():
            siblings = course.topics.filter(parent=s.validated_data.get("parent")).count()
            s.save(course=course, order=s.validated_data.get("order", siblings))
        return Response(s.data, status=201)
class TopicViewSet(viewsets.GenericViewSet):
    queryset = Topic.objects.all(); serializer_class = TopicSerializer
    def partial_update(self, request, pk=None):
        t = self.get_object()
        s = TopicSerializer(t, data=request.data, partial=True, context={"course": t.course}); s.is_valid(raise_exception=True)
        s.save(); return Response(s.data)
    def destroy(self, request, pk=None):
        self.get_object().delete(); return Response(status=204)

    @action(detail=True, methods=["get", "post"])
    def materials(self, request, pk=None):
        t = self.get_object()
        if request.method == "GET": return Response(materials_of(t, request))
        f = request.FILES.get("file")
        if not f: return Response({"file": "Choose a PDF file."}, status=400)
        if not f.name.lower().endswith(".pdf") or f.read(5) != b"%PDF-": return Response({"file": "Only PDF files are allowed."}, status=400)
        f.seek(0)
        if f.size > 20 * 1024 * 1024: return Response({"file": "Max size is 20 MB."}, status=400)
        m = TopicMaterial.objects.create(topic=t, title=(request.data.get("title") or f.name)[:120], file=f)
        return Response({"id": m.id}, status=201)
class MaterialViewSet(viewsets.GenericViewSet):
    queryset = TopicMaterial.objects.all()
    def destroy(self, request, pk=None):
        m = self.get_object(); m.file.delete(save=False); m.delete(); return Response(status=204)
