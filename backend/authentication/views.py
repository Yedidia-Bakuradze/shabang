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
        """Delete current user account"""
        request.user.delete()
        return Response(
            {"message": "User account deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
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