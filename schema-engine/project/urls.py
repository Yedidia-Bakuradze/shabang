from django.urls import path
from . import views

urlpatterns = [
    path("api/projects", views.create_project, name="create_project"),
]
