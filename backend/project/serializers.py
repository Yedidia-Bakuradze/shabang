from rest_framework import serializers
from .models import Project, User


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for listing projects with minimal details"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner_username', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner_username']


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer for full project details including entities"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'owner_username', 'entities', 'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'owner_username']
