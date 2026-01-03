"""
URL configuration for normalization app
"""
from django.urls import path
from .views import NormalizeView, CheckNormalizationView, HealthCheckView

urlpatterns = [
    path('normalize/', NormalizeView.as_view(), name='normalize'),
    path('check/', CheckNormalizationView.as_view(), name='check-normalization'),
    path('health/', HealthCheckView.as_view(), name='health'),
]
