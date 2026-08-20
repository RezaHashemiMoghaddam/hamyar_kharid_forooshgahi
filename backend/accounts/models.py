from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CUSTOMER = 'customer'
    ROLE_STORE = 'store'
    ROLE_CHOICES = ((ROLE_CUSTOMER, 'Customer'), (ROLE_STORE, 'Store'))

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CUSTOMER)
    full_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return self.email or self.username
