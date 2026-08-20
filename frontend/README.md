# همیار خرید فروشگاهی — Frontend متصل به Backend

این نسخه همان رابط کاربری نسخه Frontend-only نهایی پروژه «همیار خرید فروشگاهی» است، اما به Backend واقعی Django REST Framework متصل می‌شود.

## تکنولوژی
- HTML5
- CSS3
- JavaScript Vanilla
- Fetch API
- Django REST Framework در سمت Backend

## اتصال به Backend
به‌صورت پیش‌فرض Frontend انتظار دارد API روی آدرس زیر در دسترس باشد:

`http://127.0.0.1:8000/api`

در صورت نیاز می‌توانید قبل از اجرای Frontend مقدار `window.HAMYAR_API_BASE` را در `index.html` تنظیم کنید.

## امکانات متصل به Backend
- Register / Login / Logout
- جستجوی کالا و مشاهده جزئیات
- جستجوی فروشگاه و مشاهده جزئیات
- مسیریابی با Waze و نشان
- ثبت فروشگاه
- افزودن کالا
- مدیریت موجودی
- ویرایش اطلاعات فروشگاه
- TXT / CSV / Excel Upload
- API Key و Inventory API

## اجرا
بهتر است Frontend با Static Server اجرا شود:

```bash
python -m http.server 5500
```

سپس:

`http://127.0.0.1:5500`

Backend باید روی پورت 8000 در حال اجرا باشد.

## نکته
این نسخه هیچ داده ساختگی برای Product / Store / Inventory ندارد. داده‌ها از API واقعی خوانده و تغییرات نیز به Backend ارسال می‌شوند. فقط Token احراز هویت و تنظیمات محلی API در LocalStorage مرورگر نگهداری می‌شوند.
