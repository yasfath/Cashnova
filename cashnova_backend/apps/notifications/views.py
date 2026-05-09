from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET', 'POST'])
def notification_list_create(request):
    if request.method == 'GET':
        notifications = Notification.objects.all()
        user_id = request.query_params.get('user') or request.query_params.get('userId')

        if user_id:
            notifications = notifications.filter(user_id=user_id)

        notifications = notifications.order_by('-id')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    serializer = NotificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def notification_detail(request, pk):
    try:
        notification = Notification.objects.get(pk=pk)
    except Notification.DoesNotExist:
        return Response({"message": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)

    if request.method in ['PUT', 'PATCH']:
        serializer = NotificationSerializer(
            notification,
            data=request.data,
            partial=request.method == 'PATCH'
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    notification.delete()
    return Response({"message": "Notification deleted successfully"}, status=status.HTTP_200_OK)
