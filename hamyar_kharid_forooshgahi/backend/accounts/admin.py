from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Project', {'fields': ('role', 'full_name', 'phone_number')}),)
    add_fieldsets = UserAdmin.add_fieldsets + (('Project', {'fields': ('email', 'role', 'full_name', 'phone_number')}),)
