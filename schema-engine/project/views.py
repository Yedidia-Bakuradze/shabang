import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Project


@csrf_exempt
def create_project(request):
    # נקבל רק POST
    if request.method != "POST":
        return JsonResponse({"error": "Only POST is allowed"}, status=405)

    # לקרוא JSON מהגוף (אם יש)
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        data = {}

    name = data.get("name") or "New project"

    project = Project.objects.create(name=name)

    return JsonResponse(
        {
            "id": project.id,
            "name": project.name,
            "created_at": project.created_at.isoformat(),
        },
        status=201,
    )
