# همیار خرید فروشگاهی — Backend


## Scope
Customer: register, login, search product, view product, search store, view store, request navigation.

Store: register store, add product, manage inventory, manage store information, inventory input by manual form / TXT / Excel / API.

No online shopping, cart, order, payment, review, delivery, administrator business actor, or route calculation is implemented as application functionality.

## Main API
- POST `/api/auth/register/`
- POST `/api/auth/login/`
- POST `/api/auth/logout/`
- GET `/api/auth/me/`
- GET `/api/stats/`
- GET `/api/products/`
- GET `/api/products/{id}/`
- GET `/api/products/{id}/stores/`
- GET `/api/stores/`
- GET `/api/stores/{id}/`
- GET `/api/stores/{id}/navigation/?provider=waze|neshan`
- POST `/api/store/register/`
- GET/PATCH `/api/my-store/`
- GET/POST/PATCH/DELETE `/api/my-products/`
- GET/PATCH `/api/my-inventory/`
- POST `/api/inventory/import/`
- GET `/api/inventory-imports/`
- GET/POST `/api/inventory/api-key/`
- POST `/api/inventory/api-ingest/` with `X-STORE-API-KEY`

## Demo data
After migrations, run:

`python manage.py seed_demo`

Demo customer: `user@example.com / 123456`

Demo stores: `store1@example.com`, `store2@example.com`, `store3@example.com` — password `123456`.

## Inventory file format
The accepted TXT/CSV/Excel headers are:

`name, category, price, quantity, unit`

Example:

`کابل USB-C,دیجیتال,290000,12,عدد`
