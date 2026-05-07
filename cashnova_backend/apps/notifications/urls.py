from django.urls import path
from .views import notification_detail, notification_list_create

urlpatterns = [
    path('', notification_list_create),
    path('<int:pk>/', notification_detail),
]
