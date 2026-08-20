from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    InventoryAPIIngestView, InventoryImportLogViewSet, InventoryImportView,
    MyInventoryViewSet, MyProductViewSet, MyStoreView, PublicProductViewSet,
    PublicStoreViewSet, StatsView, StoreAPIKeyView, StoreRegistrationView,
)

router = DefaultRouter()
router.register('products', PublicProductViewSet, basename='products')
router.register('stores', PublicStoreViewSet, basename='stores')
router.register('my-products', MyProductViewSet, basename='my-products')
router.register('my-inventory', MyInventoryViewSet, basename='my-inventory')
router.register('inventory-imports', InventoryImportLogViewSet, basename='inventory-imports')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', StatsView.as_view()),
    path('store/register/', StoreRegistrationView.as_view()),
    path('my-store/', MyStoreView.as_view()),
    path('inventory/import/', InventoryImportView.as_view()),
    path('inventory/api-key/', StoreAPIKeyView.as_view()),
    path('inventory/api-ingest/', InventoryAPIIngestView.as_view()),
]
