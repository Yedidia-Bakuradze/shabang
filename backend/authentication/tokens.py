import jwt
from datetime import datetime, timedelta
from django.conf import settings
from .models import User


class CustomAccessToken:
    """Custom Access Token for User model"""
    
    def __init__(self, user_id):
        self.user_id = user_id
        self.token_type = 'access'
        self.lifetime = timedelta(minutes=15)
        self.payload = self._create_payload()
    
    def _create_payload(self):
        """Create JWT payload"""
        now = datetime.utcnow()
        return {
            'user_id': self.user_id,
            'token_type': self.token_type,
            'exp': now + self.lifetime,
            'iat': now,
        }
    
    def __str__(self):
        """Generate encoded JWT token"""
        return jwt.encode(
            self.payload,
            settings.SECRET_KEY,
            algorithm='HS256'
        )


class CustomRefreshToken:
    """Custom Refresh Token for User model"""
    
    def __init__(self, user_id):
        self.user_id = user_id
        self.token_type = 'refresh'
        self.lifetime = timedelta(days=7)
        self.payload = self._create_payload()
    
    def _create_payload(self):
        """Create JWT payload"""
        now = datetime.utcnow()
        return {
            'user_id': self.user_id,
            'token_type': self.token_type,
            'exp': now + self.lifetime,
            'iat': now,
        }
    
    def __str__(self):
        """Generate encoded JWT token"""
        return jwt.encode(
            self.payload,
            settings.SECRET_KEY,
            algorithm='HS256'
        )
    
    @property
    def access_token(self):
        """Generate access token from refresh token"""
        return CustomAccessToken(self.user_id)


def decode_token(token):
    """
    Decode JWT token and return payload
    
    Returns:
        dict: Token payload
        
    Raises:
        jwt.ExpiredSignatureError: Token has expired
        jwt.InvalidSignatureError: Invalid token signature
        jwt.DecodeError: Invalid token
    """
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=['HS256']
    )


def get_user_from_token(token_string):
    """
    Extract user from JWT token
    
    Args:
        token_string: JWT token string
        
    Returns:
        User: User object if valid
        
    Raises:
        User.DoesNotExist: User not found
        Various JWT exceptions if token is invalid
    """
    payload = decode_token(token_string)
    user_id = payload.get('user_id')
    
    if not user_id:
        raise ValueError('Token is missing user_id')
    
    try:
        user = User.objects.get(id=user_id)
        return user
    except User.DoesNotExist:
        raise User.DoesNotExist(f'User with id {user_id} not found')
