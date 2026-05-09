from django.db import models
from django.contrib.auth.models import User


class AccountProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cashnova_profile')
    avatar_url = models.TextField(blank=True, default='')
    contact_number = models.CharField(max_length=30, blank=True, default='')

    def __str__(self):
        return f"{self.user.username} profile"


class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cashnova_preferences')
    language = models.CharField(max_length=50, default='English')
    currency = models.CharField(max_length=10, default='USD')
    timezone = models.CharField(max_length=80, default='Asia/Kolkata')
    email_notifications = models.BooleanField(default=True)
    ai_prediction_alerts = models.BooleanField(default=True)
    monthly_report_reminder = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} preferences"
