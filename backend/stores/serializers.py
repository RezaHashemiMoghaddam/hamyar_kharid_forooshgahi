from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from .models import Inventory, InventoryImportLog, Product, Store, StoreAPIKey

User = get_user_model()


class StoreListSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Store
        fields = ['id', 'name', 'address', 'phone_number', 'working_hours', 'latitude', 'longitude', 'description', 'status', 'product_count']


class StoreDetailSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source='owner.full_name', read_only=True)
    phone = serializers.CharField(source='phone_number', read_only=True)
    lat = serializers.DecimalField(source='latitude', max_digits=9, decimal_places=6, read_only=True)
    lng = serializers.DecimalField(source='longitude', max_digits=9, decimal_places=6, read_only=True)
    status = serializers.CharField(read_only=True)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Store
        fields = ['id', 'name', 'owner', 'phone', 'address', 'lat', 'lng', 'working_hours', 'description', 'status', 'product_count', 'created_at', 'updated_at']


class StoreUpdateSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', required=False, write_only=True)

    class Meta:
        model = Store
        fields = ['name', 'owner_name', 'address', 'phone_number', 'working_hours', 'description', 'latitude', 'longitude']


class ProductSerializer(serializers.ModelSerializer):
    store_id = serializers.IntegerField(source='store.id', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    inventory = serializers.IntegerField(source='inventory_record.quantity', read_only=True, default=0)
    updated = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'store_id', 'store_name', 'name', 'category', 'price', 'inventory', 'unit', 'updated']

    def get_updated(self, obj):
        return obj.inventory_record.last_update.strftime('%Y-%m-%dT%H:%M:%S%z') if hasattr(obj, 'inventory_record') and obj.inventory_record else obj.updated_at.strftime('%Y-%m-%dT%H:%M:%S%z')


class MyProductSerializer(serializers.ModelSerializer):
    inventory = serializers.IntegerField(write_only=True, required=False, min_value=0)

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'price', 'inventory', 'unit']
        read_only_fields = ['id']

    def create(self, validated_data):
        inventory = validated_data.pop('inventory', 0)
        store = self.context['request'].user.store
        with transaction.atomic():
            product = Product.objects.create(store=store, **validated_data)
            Inventory.objects.create(product=product, store=store, quantity=inventory)
        return product


class InventorySerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    category = serializers.CharField(source='product.category', read_only=True)
    price = serializers.DecimalField(source='product.price', max_digits=14, decimal_places=2, read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)

    class Meta:
        model = Inventory
        fields = ['id', 'product_id', 'product_name', 'category', 'price', 'unit', 'quantity', 'last_update']
        read_only_fields = ['id', 'product_id', 'product_name', 'category', 'price', 'unit', 'last_update']


class InventoryImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryImportLog
        fields = ['id', 'source', 'file_name', 'processed_rows', 'failed_rows', 'created_at']


class StoreAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreAPIKey
        fields = ['key', 'is_active', 'created_at', 'rotated_at']
        read_only_fields = ['key', 'created_at', 'rotated_at']


class StoreRegistrationSerializer(serializers.Serializer):
    store_name = serializers.CharField(max_length=255)
    owner_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField()
    lat = serializers.DecimalField(max_digits=9, decimal_places=6)
    lng = serializers.DecimalField(max_digits=9, decimal_places=6)
    description = serializers.CharField(required=False, allow_blank=True)
    working_hours = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('این ایمیل قبلاً ثبت شده است.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'].lower().strip(),
            full_name=validated_data['owner_name'].strip(),
            password=validated_data['password'],
            role=User.ROLE_STORE,
        )
        return Store.objects.create(
            owner=user,
            name=validated_data['store_name'].strip(),
            address=validated_data['address'].strip(),
            phone_number=validated_data['phone'].strip(),
            latitude=validated_data['lat'],
            longitude=validated_data['lng'],
            working_hours=validated_data.get('working_hours', '').strip(),
            description=validated_data.get('description', '').strip(),
        )
