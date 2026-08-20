## ساختار

```text
hamyar_kharid_forooshgahi/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── accounts/
│   ├── stores/
│   └── hamyar_backend/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```
## 1) بررسی و اجرای سریع سامانه:

### برای بررسی سریع سامانه از فایل Demo استفاده کنید.

### اجرای سریع سامانه:

    1-open start_backend and wait for installation to complete
    2-open start_frontend
    3-use http://127.0.0.1:5500 on Browser
## 2) اجرای Backend در ویندوز

PowerShell را باز کنید:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

اگر PowerShell اجازه فعال‌سازی محیط را نداد، از این روش استفاده کنید:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_demo
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

## 3) اجرای Frontend

یک Terminal/PowerShell دوم باز کنید:

```powershell
cd frontend
py -m http.server 5500
```

سپس در مرورگر:

```text
http://127.0.0.1:5500
```

یا:

```text
http://localhost:5500
```

**بهتر است فایل `index.html` را مستقیم با دوبار کلیک باز نکنید**؛ Frontend را با HTTP server اجرا کنید تا رفتار درخواست‌های API و CORS مثل محیط واقعی باشد.

## 4) حساب‌های Demo

### Customer

```text
Email: user@example.com
Password: 123456
```

### Store 1

```text
Email: store1@example.com
Password: 123456
```

### Store 2

```text
Email: store2@example.com
Password: 123456
```

### Store 3

```text
Email: store3@example.com
Password: 123456
```

دستور `seed_demo` داده‌های نمونه موردنیاز برای نمایش سریع سایت را ایجاد می‌کند.

## 5) API Base URL

Frontend به‌صورت پیش‌فرض از این API استفاده می‌کند:

```text
http://127.0.0.1:8000/api
```

در صورت نیاز می‌توان قبل از بارگذاری برنامه مقدار `window.HAMYAR_API_BASE` را تنظیم کرد. مقدار API Base در LocalStorage هم قابل نگهداری است.

## 6) قابلیت‌ها

Customer:
- Register
- Login
- Search Product
- View Product Information
- Search Store
- View Store Information
- Navigation via Waze / Neshan

Store:
- Store Registration
- Add Product
- Manage Inventory
- Manage Store Information
- TXT/CSV Import
- Excel Import
- Inventory API integration


