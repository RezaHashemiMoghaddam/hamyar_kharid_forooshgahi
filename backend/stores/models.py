import secrets
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Store(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='store')
    name = models.CharField(max_length=255)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.DecimalField(max_digits=9, decimal_places=6, validators=[MinValueValidator(-180), MaxValueValidator(180)])
    phone_number = models.CharField(max_length=30)
    working_hours = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['name'], name='store_name_idx')]

    @property
    def status(self):
        return 'فعال' if self.is_active else 'غیرفعال'


class Product(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=50, default='عدد')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='product_name_idx'),
            models.Index(fields=['category'], name='product_category_idx'),
            models.Index(fields=['store', 'name'], name='product_store_name_idx'),
        ]


class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory_record')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='inventory_records')
    quantity = models.PositiveIntegerField(default=0)
    last_update = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['product', 'store'], name='unique_product_store_inventory')]
        indexes = [models.Index(fields=['store', 'quantity'], name='inventory_store_quantity_idx')]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.product.store_id != self.store_id:
            raise ValidationError('Inventory store must match the product store.')

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class InventoryImportLog(models.Model):
    SOURCE_MANUAL = 'manual'
    SOURCE_TXT = 'txt'
    SOURCE_EXCEL = 'excel'
    SOURCE_API = 'api'
    SOURCE_CHOICES = [
        (SOURCE_MANUAL, 'Manual'),
        (SOURCE_TXT, 'TXT'),
        (SOURCE_EXCEL, 'Excel'),
        (SOURCE_API, 'API'),
    ]
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='import_logs')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    file_name = models.CharField(max_length=255, blank=True)
    processed_rows = models.PositiveIntegerField(default=0)
    failed_rows = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


def generate_api_key():
    return secrets.token_urlsafe(32)


class StoreAPIKey(models.Model):
    store = models.OneToOneField(Store, on_delete=models.CASCADE, related_name='api_key')
    key = models.CharField(max_length=64, unique=True, default=generate_api_key)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    rotated_at = models.DateTimeField(auto_now=True)
