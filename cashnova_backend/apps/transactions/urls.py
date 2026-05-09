from django.urls import path
from .views import transaction_detail, transaction_list_create

urlpatterns = [
    path('', transaction_list_create),
    path('<int:pk>/', transaction_detail),
]
