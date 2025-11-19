from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class ProjectListView(APIView):
    # permission_classes = [IsAuthenticated] Enable for auth connection
    
    def get(self,req):
        return JsonResponse({"message":"project list get"})

    def post(self,req):
        if not req.user.is_authenticated:
            return JsonResponse({"error":"auth is needed"})
        return JsonResponse({"message":"project list post"})

    def put(self,req):
        return JsonResponse({"message":"project list put"})

    def delete(self,req):
        return JsonResponse({"message":"project list delete"})