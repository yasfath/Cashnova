from django.urls import path
from .views import (
    change_password,
    forgot_password,
    login_user,
    preferences_view,
    profile_view,
    register_user,
    send_otp,
    social_auth,
    social_auth_callback,
    test_api,
)


urlpatterns = [
    path('test/', test_api),
    path('register/', register_user),
    path('login/', login_user),
    path('profile/', profile_view),
    path('change-password/', change_password),
    path('send-otp/', send_otp),
    path('forgot-password/', forgot_password),
    path('preferences/', preferences_view),
    path('auth/<str:provider>/callback/', social_auth_callback),
    path('auth/<str:provider>/', social_auth),
]
