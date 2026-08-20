from rest_framework.permissions import BasePermission
from accounts.models import CustomUser


class IsStoreOwner(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == CustomUser.ROLE_STORE and hasattr(request.user, 'store'))
