from django.urls import path
from .views import ProjectListView, ProjectDetailView
from .dsd_views import GenerateDSDView

urlpatterns = [
    path('', ProjectListView.as_view(), name='project-list'),
    path('<int:project_id>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<int:project_id>/generate-dsd/', GenerateDSDView.as_view(), name='generate-dsd'),
]
