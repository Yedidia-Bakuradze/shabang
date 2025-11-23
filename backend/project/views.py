from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Project, User
from .serializers import ProjectListSerializer, ProjectDetailSerializer

# This class represents all the general and basic project CRUD operations that are preformed on the /api/product endpoint
class ProjectListView(APIView):
    """
    GET: List all projects created by the authenticated user
    POST: Create a new project (authenticated users only)
    """
    # TODO: Re-enable authentication after implementing JWT
    # permission_classes = [IsAuthenticated]
    
    def get(self, req):
        """Return all projects owned by the authenticated user"""
        # Filter projects by the authenticated user
        try:
            user = User.objects.get(id=req.user.id)
            projects = Project.objects.filter(owner=user)
            serializer = ProjectListSerializer(projects, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, req):
        """Create a new project for the authenticated user"""
        # TODO: Require authentication after implementing JWT
        # For now, allow creating projects without a user
        user = None
        if req.user and req.user.is_authenticated:
            try:
                user = User.objects.get(id=req.user.id)
            except User.DoesNotExist:
                pass
        
        serializer = ProjectDetailSerializer(data=req.data)
        if serializer.is_valid():
            # Save with owner if user exists, otherwise save without owner
            if user:
                serializer.save(owner=user)
            else:
                serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# This class represents all the general and basic project CRUD operations that are preformed on the /api/product/:id endpoint
class ProjectDetailView(APIView):
    """
    GET: Retrieve a specific project
    PUT: Update a project (owner only)
    DELETE: Delete a project (owner only)
    """
    # TODO: Re-enable authentication after implementing JWT
    # permission_classes = [IsAuthenticated]
    
    def get_project(self, project_id, user=None):
        """Helper method to get project by ID"""
        try:
            project = Project.objects.get(id=project_id)
            return project
        except Project.DoesNotExist:
            return None
    
    def get(self, req, project_id):
        """Get project details"""
        project = self.get_project(project_id)
        
        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProjectDetailSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, req, project_id):
        """Update project (owner only)"""
        project = self.get_project(project_id)
        
        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is the owner
        if project.owner.id != req.user.id:
            return Response(
                {"error": "You don't have permission to update this project"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ProjectDetailSerializer(project, data=req.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, req, project_id):
        """Delete project (owner only)"""
        project = self.get_project(project_id)
        
        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is the owner
        if project.owner.id != req.user.id:
            return Response(
                {"error": "You don't have permission to delete this project"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        project.delete()
        return Response(
            {"message": "Project deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )