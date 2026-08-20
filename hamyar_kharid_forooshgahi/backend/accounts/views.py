from django.contrib.auth import login, logout
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomUser
from .serializers import CustomerRegisterSerializer, LoginSerializer, UserSerializer, StoreRegisterSerializer
from stores.models import Store
from stores.serializers import StoreDetailSerializer


class CustomerRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'user': UserSerializer(user).data, 'token': token.key}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        login(request, user)
        payload = {'user': UserSerializer(user).data, 'token': token.key}
        if user.role == CustomUser.ROLE_STORE:
            payload['store'] = StoreDetailSerializer(user.store).data
        return Response(payload)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response({'detail': 'با موفقیت خارج شدید.'})


class MeView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        payload = {'user': UserSerializer(request.user).data}
        if request.user.role == CustomUser.ROLE_STORE:
            payload['store'] = StoreDetailSerializer(request.user.store).data
        return Response(payload)
