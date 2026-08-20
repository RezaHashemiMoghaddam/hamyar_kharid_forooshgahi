from secrets import token_urlsafe
from urllib.parse import urlencode

from django.db import transaction
from django.db.models import Count, Q
from rest_framework import permissions, status
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from accounts.serializers import UserSerializer
from .models import Inventory, InventoryImportLog, Product, Store, StoreAPIKey
from .permissions import IsStoreOwner
from .serializers import (
    InventoryImportLogSerializer, InventorySerializer, MyProductSerializer, ProductSerializer,
    StoreAPIKeySerializer, StoreDetailSerializer, StoreListSerializer, StoreRegistrationSerializer,
    StoreUpdateSerializer,
)
from .services import InventoryImportService


class PublicProductViewSet(ReadOnlyModelViewSet):
    queryset = Product.objects.filter(store__is_active=True).select_related('store').prefetch_related('inventory_record')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'category', 'store__name']
    ordering_fields = ['name', 'price', 'updated_at']
    filterset_fields = ['category', 'store']

    @action(detail=True, methods=['get'], url_path='stores')
    def stores(self, request, pk=None):
        product = self.get_object()
        inv = getattr(product, 'inventory_record', None)
        if not inv:
            return Response([])
        return Response([{
            'store_id': inv.store_id,
            'store_name': inv.store.name,
            'price': product.price,
            'quantity': inv.quantity,
            'unit': product.unit,
            'address': inv.store.address,
            'latitude': inv.store.latitude,
            'longitude': inv.store.longitude,
        }])


class PublicStoreViewSet(ReadOnlyModelViewSet):
    queryset = Store.objects.filter(is_active=True).annotate(product_count=Count('products', distinct=True)).prefetch_related('products__inventory_record')
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    serializer_class = StoreListSerializer
    search_fields = ['name', 'address', 'phone_number']
    ordering_fields = ['name', 'created_at']
    filterset_fields = ['is_active']

    def get_serializer_class(self):
        return StoreDetailSerializer if self.action == 'retrieve' else StoreListSerializer

    @action(detail=True, methods=['get'], url_path='navigation')
    def navigation(self, request, pk=None):
        store = self.get_object()
        provider = request.query_params.get('provider', 'waze').lower()
        lat, lng = str(store.latitude), str(store.longitude)
        if provider == 'waze':
            url = f"https://www.waze.com/ul?{urlencode({'ll': f'{lat},{lng}', 'navigate': 'yes'})}"
        elif provider == 'neshan':
            url = f"https://nshn.ir/maps?{urlencode({'destination': f'{lat},{lng}', 'type': 'drive'})}"
        else:
            return Response({'detail': 'سرویس مسیریابی پشتیبانی نمی‌شود.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'provider': provider, 'url': url, 'destination': {'latitude': lat, 'longitude': lng}})


class StatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        stores = Store.objects.filter(is_active=True).count()
        products = Product.objects.filter(store__is_active=True).count()
        return Response({'stores': stores, 'products': products, 'status': 'فعال'})


class StoreRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = StoreRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        store = serializer.save()
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=store.owner)
        return Response({
            'user': UserSerializer(store.owner).data,
            'store': StoreDetailSerializer(store).data,
            'token': token.key,
        }, status=status.HTTP_201_CREATED)


class MyStoreView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsStoreOwner]

    def get(self, request):
        return Response(StoreDetailSerializer(request.user.store).data)

    def patch(self, request):
        serializer = StoreUpdateSerializer(request.user.store, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        owner_name = serializer.validated_data.pop('owner', {}).get('full_name') if 'owner' in serializer.validated_data else None
        store = serializer.save()
        if owner_name is not None:
            request.user.full_name = owner_name
            request.user.save(update_fields=['full_name'])
        return Response(StoreDetailSerializer(store).data)


class MyProductViewSet(ModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsStoreOwner]
    serializer_class = MyProductSerializer

    def get_queryset(self):
        return Product.objects.filter(store=self.request.user.store).select_related('store').prefetch_related('inventory_record')

    def perform_create(self, serializer):
        serializer.save()


class MyInventoryViewSet(ModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsStoreOwner]
    serializer_class = InventorySerializer
    http_method_names = ['get', 'patch', 'put', 'head', 'options']

    def get_queryset(self):
        return Inventory.objects.filter(store=self.request.user.store).select_related('product', 'store')

    def perform_update(self, serializer):
        serializer.save(store=self.request.user.store)


class InventoryImportView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsStoreOwner]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': "فایل را در فیلد 'file' ارسال کنید."}, status=400)
        name = uploaded.name.lower()
        try:
            if name.endswith(('.xlsx', '.xlsm', '.xltx', '.xltm')):
                rows = InventoryImportService.parse_excel(uploaded)
                source = 'excel'
            elif name.endswith(('.txt', '.csv')):
                rows = InventoryImportService.parse_txt(uploaded.read())
                source = 'txt'
            else:
                return Response({'detail': 'فرمت مجاز: TXT, CSV, XLSX, XLSM'}, status=400)
            log, errors = InventoryImportService.import_rows(request.user.store, rows, source, uploaded.name)
            return Response({'log': InventoryImportLogSerializer(log).data, 'errors': errors})
        except Exception as exc:
            return Response({'detail': f'خطا در پردازش فایل: {exc}'}, status=400)


class InventoryImportLogViewSet(ReadOnlyModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsStoreOwner]
    serializer_class = InventoryImportLogSerializer

    def get_queryset(self):
        return InventoryImportLog.objects.filter(store=self.request.user.store)


class StoreAPIKeyView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsStoreOwner]

    def get(self, request):
        key, _ = StoreAPIKey.objects.get_or_create(store=request.user.store, defaults={'key': token_urlsafe(32)})
        return Response(StoreAPIKeySerializer(key).data)

    def post(self, request):
        key, _ = StoreAPIKey.objects.update_or_create(store=request.user.store, defaults={'key': token_urlsafe(32), 'is_active': True})
        return Response(StoreAPIKeySerializer(key).data)


class InventoryAPIIngestView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser]

    def post(self, request):
        api_key = request.headers.get('X-STORE-API-KEY')
        if not api_key:
            return Response({'detail': 'X-STORE-API-KEY الزامی است.'}, status=401)
        try:
            key = StoreAPIKey.objects.select_related('store').get(key=api_key, is_active=True)
        except StoreAPIKey.DoesNotExist:
            return Response({'detail': 'API Key نامعتبر است.'}, status=401)
        items = request.data.get('items') if isinstance(request.data, dict) else None
        if not isinstance(items, list):
            return Response({'detail': 'بدنه باید شامل آرایه items باشد.'}, status=400)
        log, errors = InventoryImportService.import_rows(key.store, items, 'api', 'API request')
        return Response({'log': InventoryImportLogSerializer(log).data, 'errors': errors})
