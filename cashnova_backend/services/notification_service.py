from apps.notifications.models import Notification


def get_all_notifications():
    return Notification.objects.all().order_by('-id')


def create_notification(user, title, message):
    return Notification.objects.create(
        user=user,
        title=title,
        message=message
    )