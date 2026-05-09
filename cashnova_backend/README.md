# CASHNOVA BACKEND SETUP

## 1. Create virtual environment

python -m venv venv

## 2. Activate

venv\Scripts\activate

## 3. Install dependencies

pip install -r requirements.txt

## 4. Run migrations

python manage.py makemigrations
python manage.py migrate

## 5. Run server

python manage.py runserver

## 6. API Base URL

http://127.0.0.1:8000/api/

## 7. Social Login Credentials

Google and Microsoft OAuth use the same backend pattern. Add the credentials in `.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/auth/google/callback/

MICROSOFT_CLIENT_ID=your-microsoft-application-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://127.0.0.1:8000/api/auth/microsoft/callback/

SOCIAL_AUTH_FRONTEND_CALLBACK_URL=http://127.0.0.1:5173/auth/social-callback
SOCIAL_AUTH_ALLOWED_CALLBACK_HOSTS=localhost,127.0.0.1
```

In Microsoft Azure App Registration, add this exact redirect URI:

```text
http://127.0.0.1:8000/api/auth/microsoft/callback/
```

For cloud deployment, use the deployed backend callback instead:

```text
https://your-backend-domain.com/api/auth/microsoft/callback/
```

Then set the matching backend env vars:

```env
ALLOWED_HOSTS=your-backend-domain.com
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
MICROSOFT_REDIRECT_URI=https://your-backend-domain.com/api/auth/microsoft/callback/
SOCIAL_AUTH_FRONTEND_CALLBACK_URL=https://your-frontend-domain.com/auth/social-callback
SOCIAL_AUTH_ALLOWED_CALLBACK_HOSTS=your-frontend-domain.com
```

## Important APIs:

* /api/accounts/register/
* /api/accounts/login/
* /api/transactions/
* /api/categories/
* /api/analytics/summary/
* /api/ai/predict/
