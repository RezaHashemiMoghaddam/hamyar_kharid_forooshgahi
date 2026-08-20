import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from stores.models import generate_api_key


class Migration(migrations.Migration):
    initial = True
    dependencies = [('accounts', '0001_initial')]
    operations = [
        migrations.CreateModel(
            name='Store',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('address', models.TextField()),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9, validators=[django.core.validators.MinValueValidator(-90), django.core.validators.MaxValueValidator(90)])),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9, validators=[django.core.validators.MinValueValidator(-180), django.core.validators.MaxValueValidator(180)])),
                ('phone_number', models.CharField(max_length=30)),
                ('working_hours', models.CharField(blank=True, max_length=255)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='store', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.AddIndex(model_name='store', index=models.Index(fields=['name'], name='store_name_idx')),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('category', models.CharField(max_length=255)),
                ('price', models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(0)])),
                ('unit', models.CharField(default='عدد', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('store', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to='stores.store')),
            ],
            options={'ordering': ['name']},
        ),
        migrations.AddIndex(model_name='product', index=models.Index(fields=['name'], name='product_name_idx')),
        migrations.AddIndex(model_name='product', index=models.Index(fields=['category'], name='product_category_idx')),
        migrations.AddIndex(model_name='product', index=models.Index(fields=['store', 'name'], name='product_store_name_idx')),
        migrations.CreateModel(
            name='Inventory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=0)),
                ('last_update', models.DateTimeField(auto_now=True)),
                ('product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='inventory_record', to='stores.product')),
                ('store', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inventory_records', to='stores.store')),
            ],
            options={},
        ),
        migrations.AddConstraint(model_name='inventory', constraint=models.UniqueConstraint(fields=('product', 'store'), name='unique_product_store_inventory')),
        migrations.AddIndex(model_name='inventory', index=models.Index(fields=['store', 'quantity'], name='inventory_store_quantity_idx')),
        migrations.CreateModel(
            name='InventoryImportLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source', models.CharField(choices=[('manual', 'Manual'), ('txt', 'TXT'), ('excel', 'Excel'), ('api', 'API')], max_length=20)),
                ('file_name', models.CharField(blank=True, max_length=255)),
                ('processed_rows', models.PositiveIntegerField(default=0)),
                ('failed_rows', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('store', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='import_logs', to='stores.store')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='StoreAPIKey',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(default=generate_api_key, max_length=64, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('rotated_at', models.DateTimeField(auto_now=True)),
                ('store', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='api_key', to='stores.store')),
            ],
        ),
    ]
