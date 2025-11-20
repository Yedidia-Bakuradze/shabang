from django.urls import path
from .views import (
    UserSignupView,
    UserLoginView,
    UserRefreshTokenView,
    UserDetailView
)

urlpatterns = [
    # Public endpoints
    path('signup/', UserSignupView.as_view(), name='signup'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('refresh/', UserRefreshTokenView.as_view(), name='refresh'),
    path('profile/', UserDetailView.as_view(), name='profile'),
]
