from decimal import Decimal
from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from stores.models import Store, Product, Inventory


class Command(BaseCommand):
    help = 'Create the demo data shown by the Frontend-only version of Hamyar Kharid Forooshgahi.'

    def handle(self, *args, **options):
        customer, created = CustomUser.objects.get_or_create(username='user@example.com', defaults={
            'email': 'user@example.com', 'full_name': 'کاربر نمونه', 'role': CustomUser.ROLE_CUSTOMER,
        })
        customer.email = 'user@example.com'; customer.full_name = 'کاربر نمونه'; customer.role = CustomUser.ROLE_CUSTOMER
        customer.set_password('123456'); customer.save()

        stores = [
            dict(email='store1@example.com', name='فروشگاه مرکزی شیراز', owner='علی رضایی', phone='071-12345678', address='شیراز، بلوار چمران', lat=29.6203, lng=52.5311, desc='فروشگاه عمومی با تنوع بالای کالا'),
            dict(email='store2@example.com', name='سوپرمارکت بهار', owner='مریم احمدی', phone='071-22334455', address='شیراز، معالی‌آباد', lat=29.6126, lng=52.4944, desc='مواد غذایی و کالاهای مصرف روزانه'),
            dict(email='store3@example.com', name='خانه دیجیتال', owner='رضا کریمی', phone='071-33445566', address='شیراز، خیابان عفیف‌آباد', lat=29.6232, lng=52.5108, desc='لوازم جانبی و تجهیزات دیجیتال'),
        ]
        product_data = [
            ('روغن مایع 1.5 لیتری','مواد غذایی',185000,24,'عدد'),('برنج ایرانی 10 کیلویی','مواد غذایی',1280000,7,'کیسه'),
            ('شیر کم‌چرب','لبنیات',42000,41,'عدد'),('ماکارونی 700 گرم','مواد غذایی',62000,18,'بسته'),
            ('کابل USB-C','دیجیتال',290000,12,'عدد'),('پاوربانک 10000mAh','دیجیتال',980000,3,'عدد'),
        ]
        for idx, spec in enumerate(stores):
            user, _ = CustomUser.objects.get_or_create(username=spec['email'], defaults={'email': spec['email'], 'role': CustomUser.ROLE_STORE})
            user.email = spec['email']; user.full_name = spec['owner']; user.role = CustomUser.ROLE_STORE; user.set_password('123456'); user.save()
            store, _ = Store.objects.update_or_create(owner=user, defaults={'name': spec['name'], 'address': spec['address'], 'phone_number': spec['phone'], 'latitude': Decimal(str(spec['lat'])), 'longitude': Decimal(str(spec['lng'])), 'description': spec['desc'], 'working_hours': '09:00 تا 22:00', 'is_active': True})
            for local_idx, (name, category, price, qty, unit) in enumerate(product_data[idx*2:idx*2+2], start=1):
                product, _ = Product.objects.update_or_create(store=store, name=name, defaults={'category': category, 'price': Decimal(str(price)), 'unit': unit})
                Inventory.objects.update_or_create(product=product, store=store, defaults={'quantity': qty})
        self.stdout.write(self.style.SUCCESS('Demo data for Hamyar Kharid Forooshgahi created.'))
