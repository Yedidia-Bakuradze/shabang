# from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

# TODO This model should be remove, it is used only to have a temporarly solution to the issue that we done have user models yet
class User(models.Model):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.username

class Project(models.Model):

    owner = models.ForeignKey(User, on_delete=models.CASCADE,related_name='projects')

    name=models.CharField(max_length=255)
    description=models.TextField(blank=True,null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    entities = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} (by {self.owner.username})"