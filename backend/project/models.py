# from django.contrib.auth.models import User
from django.db import models
from authentication.models import User

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