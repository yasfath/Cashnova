from django.urls import path, include
from accounts.views import (
    change_password,
    forgot_password,
    preferences_view,
    profile_view,
    send_otp,
    social_auth,
    social_auth_callback,
)


urlpatterns = [
    path('accounts/', include('accounts.urls')),
    path('profile/', profile_view),
    path('change-password/', change_password),
    path('forgot-password/', forgot_password),
    path('send-otp/', send_otp),
    path('preferences/', preferences_view),
    path('settings/', preferences_view),
    path('auth/send-otp/', send_otp),
    path('auth/forgot-password/', forgot_password),
    path('auth/change-password/', change_password),
    path('auth/<str:provider>/callback/', social_auth_callback),
    path('auth/<str:provider>/callback', social_auth_callback),
    path('auth/<str:provider>/', social_auth),
    path('users/', include('apps.users.urls')),
    path('categories/', include('apps.categories.urls')),
    path('transactions/', include('apps.transactions.urls')),
    path('analytics/', include('apps.analytics.urls')),
    path('ai/', include('apps.ai_engine.urls')),
    path('notifications/', include('apps.notifications.urls')),
]
