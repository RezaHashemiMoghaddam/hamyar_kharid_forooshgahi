import django_filters
from .models import Product, Store


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category', lookup_expr='iexact')
    store = django_filters.NumberFilter(field_name='store_id')

    class Meta:
        model = Product
        fields = ['category', 'store']


class StoreFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(method='filter_status')

    def filter_status(self, queryset, name, value):
        return queryset.filter(is_active=(value == 'فعال')) if value else queryset

    class Meta:
        model = Store
        fields = ['status']
