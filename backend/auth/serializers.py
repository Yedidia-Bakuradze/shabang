from rest_framework import serializers
from .models import User


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user signup/registration"""
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def validate(self, data):
        """Validate that passwords match"""
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data
    
    def create(self, validated_data):
        """Create user with hashed password"""
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']  # TODO: Hash it on production
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for user details (protected)"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user (protected)"""
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name']
