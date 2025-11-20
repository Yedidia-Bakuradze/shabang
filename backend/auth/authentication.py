import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User
from .tokens import decode_token
from django.conf import settings


class CustomUserJWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication for the User model.
    Extracts user from JWT token and sets it on request.user
    """
    
    def authenticate(self, request):
        """
        Authenticate the request by extracting and validating the JWT token.
        
        Args:
            request: HTTP request object
            
        Returns:
            tuple: (user, payload) if token is valid
            None: If no token provided (let other auth classes handle it)
            
        Raises:
            AuthenticationFailed: If token is invalid or expired
        """
        # Extract Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header:
            return None
        
        if not auth_header.startswith('Bearer '):
            return None
        
        # Extract token string
        token_string = auth_header[7:]  # Remove "Bearer "
        
        try:
            # Decode and validate token
            payload = decode_token(token_string)
            
            # Extract user_id from payload
            user_id = payload.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Token is missing user_id')
            
            # Fetch user from database
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise AuthenticationFailed('User not found')
            
            return (user, payload)
        
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidSignatureError:
            raise AuthenticationFailed('Invalid token signature')
        except jwt.DecodeError:
            raise AuthenticationFailed('Invalid token format')
        except Exception as e:
            raise AuthenticationFailed(f'Authentication failed: {str(e)}')
