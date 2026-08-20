from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'full_name', 'phone_number', 'role']
        read_only_fields = ['id', 'role', 'username']


class CustomerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['full_name', 'email', 'password']

    def validate_email(self, value):
        value = value.lower().strip()
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('این ایمیل قبلاً ثبت شده است.')
        return value

    def create(self, validated_data):
        email = validated_data['email']
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            full_name=validated_data['full_name'].strip(),
            password=validated_data['password'],
            role=CustomUser.ROLE_CUSTOMER,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email'].lower().strip()
        user = authenticate(username=email, password=attrs['password'])
        if not user or not user.is_active:
            raise serializers.ValidationError('ایمیل یا رمز عبور صحیح نیست.')
        attrs['user'] = user
        return attrs


class StoreRegisterSerializer(serializers.Serializer):
    store_name = serializers.CharField(max_length=255)
    owner_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    phone_number = serializers.CharField(max_length=30)
    address = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    description = serializers.CharField(required=False, allow_blank=True)
    working_hours = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('این ایمیل قبلاً ثبت شده است.')
        return value
