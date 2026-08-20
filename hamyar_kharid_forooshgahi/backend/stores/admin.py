from django.contrib import admin
from .models import Inventory, InventoryImportLog, Product, Store, StoreAPIKey

admin.site.register(Store)
admin.site.register(Product)
admin.site.register(Inventory)
admin.site.register(InventoryImportLog)
admin.site.register(StoreAPIKey)
