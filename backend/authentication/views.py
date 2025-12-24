from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.hashers import check_password
from .models import User
from .tokens import CustomRefreshToken, CustomAccessToken
from .serializers import (
    UserCreateSerializer,
    UserLoginSerializer,
    UserDetailSerializer,
    UserUpdateSerializer
)
from datetime import timedelta
from django.utils import timezone


class UserSignupView(APIView):
    """
    POST: Create new user account (public)
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Create a new user account"""
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "User created successfully",
                    "user": UserDetailSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    POST: Authenticate user and return JWT tokens (public)
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Authenticate user and generate tokens"""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            try:
                user = User.objects.get(username=username)
                
                # Check password using Django's hash comparison
                if not check_password(password, user.password):
                    return Response(
                        {"error": "Invalid username or password"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

                if user.deleted_at:
                    grace_period_expiry = user.deleted_at + timedelta(days=7)
                    
                    if timezone.now() < grace_period_expiry:
                        return Response({
                            "error": "recovery_required",
                            "message": "This account is scheduled for deletion. Would you like to recover it?",
                            "deadline": grace_period_expiry
                        }, status=status.HTTP_403_FORBIDDEN)
                    else:
                        # Period expired: effectively treat as gone
                        return Response({"error": "Account no longer exists"}, status=status.HTTP_404_NOT_FOUND)

                if not user.is_active:
                    return Response(
                        {"error": "User account is inactive"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Generate custom JWT tokens
                refresh_token = CustomRefreshToken(user.id)
                access_token = refresh_token.access_token
                
                return Response(
                    {
                        "message": "Login successful",
                        "access_token": str(access_token),
                        "refresh_token": str(refresh_token),
                        "user": UserDetailSerializer(user).data
                    },
                    status=status.HTTP_200_OK
                )
            
            except User.DoesNotExist:
                return Response(
                    {"error": "Invalid username or password"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    """
    GET: Retrieve current user profile (protected)
    PUT: Update current user profile (protected)
    DELETE: Delete current user account (protected)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user details"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        """Update current user details"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "User updated successfully",
                    "user": UserDetailSerializer(request.user).data
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        """Mark account for deletion with a 1-week grace period"""
        user = request.user
        user.deleted_at = timezone.now()
        user.is_active = False
        user.save()
        return Response(
            {"message": "Account scheduled for deletion. You have 7 days to recover it."},
            status=status.HTTP_200_OK
        )


class UserRefreshTokenView(APIView):
    """
    POST: Refresh access token using refresh token (public)
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Generate new access token from refresh token"""
        refresh_token_string = request.data.get('refresh_token')
        
        if not refresh_token_string:
            return Response(
                {"error": "refresh_token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .tokens import decode_token
            
            # Validate refresh token
            payload = decode_token(refresh_token_string)
            user_id = payload.get('user_id')
            
            # Verify user still exists and is active
            user = User.objects.get(id=user_id, is_active=True)
            
            # Generate new access token
            access_token = CustomAccessToken(user_id)
            
            return Response(
                {
                    "message": "Token refreshed successfully",
                    "access_token": str(access_token)
                },
                status=status.HTTP_200_OK
            )
        
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or inactive"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {"error": f"Invalid refresh token: {str(e)}"},
                status=status.HTTP_401_UNAUTHORIZED
            )

class UserRecoverView(APIView):
    """Restore a soft-deleted account within the grace period"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(username=username)
            
            if not check_password(password, user.password):
                return Response(
                    {"error": "Invalid username or password"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if user.deleted_at:
                user.deleted_at = None
                user.is_active = True
                user.save()
                return Response(
                    {"message": "Account recovered successfully. You can now log in."}, 
                    status=status.HTTP_200_OK
                )
            
            return Response(
                {"error": "No recovery needed."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )