from django.urls import path
from .views import ProjectListView, ProjectDetailView
from .dsd_views import GenerateDSDView
from .normalization_views import NormalizeSchemaView, CheckNormalizationView

urlpatterns = [
    path('', ProjectListView.as_view(), name='project-list'),
    path('<int:project_id>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<int:project_id>/generate-dsd/', GenerateDSDView.as_view(), name='generate-dsd'),
    path('<int:project_id>/normalize/', NormalizeSchemaView.as_view(), name='normalize-schema'),
    path('<int:project_id>/check-normalization/', CheckNormalizationView.as_view(), name='check-normalization'),
]
