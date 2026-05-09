from django.urls import path
from .views import ai_insight, assistant_reply, predict_cashflow

urlpatterns = [
    path('insight/', ai_insight),
    path('predict/', predict_cashflow),
    path('assistant/', assistant_reply),
]
