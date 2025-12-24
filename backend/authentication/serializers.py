from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password
import math
import re

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user signup/registration"""
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {
                'write_only': True,
                'error_messages': {
                    'max_length': 'Password cannot have more than 255 characters.'
                }
            },
            'username': {
                'error_messages': {
                    'max_length': 'Username cannot have more than 100 characters.'
                }
            }
        }
    
    def validate_username(self, value):
        """Validate username length"""
        if len(value) > 100:
            raise serializers.ValidationError("Username cannot have more than 100 characters.")
        return value

    def validate_password(self, value):
        """
        Check that the password is strong, I know that it is shitty checking, but 
        Fuck it
        """
        if len(value) > 255:
            raise serializers.ValidationError("Password cannot have more than 255 characters.")
        def calculate_entropy(password: str) -> float:
            """Approximate KeePassXC-style entropy in bits."""
            charset = 0

            if re.search(r'[a-z]', password):
                charset += 26
            if re.search(r'[A-Z]', password):
                charset += 26
            if re.search(r'[0-9]', password):
                charset += 10
            if re.search(r'[!@#$%^&*(),.?":{}|<>\[\]\\\/;\'`~_\-+=]', password):
                charset += 33

            if charset == 0:
                return 0
            return len(password) * math.log2(charset)

        entropy = calculate_entropy(value)
        if entropy < 60: # TODO: up it to 80 for production
            raise serializers.ValidationError("Password must be stronger, challenge yourself.")
        return value
    
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
            password=make_password(validated_data['password'])  # Hash password
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
