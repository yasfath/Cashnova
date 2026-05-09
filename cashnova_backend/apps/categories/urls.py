from django.urls import path
from .views import category_detail, category_list_create

urlpatterns = [
    path('', category_list_create),
    path('<int:pk>/', category_detail),
]
