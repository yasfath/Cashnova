from django.urls import path
from .views import user_detail, user_list

urlpatterns = [
    path('', user_list),
    path('<int:pk>/', user_detail),
]
