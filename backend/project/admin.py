from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import User, Project

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'created_at')
    search_fields = ('username', 'email')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'created_at')
    list_filter = ('created_at', 'owner')
    search_fields = ('name',)