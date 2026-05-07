from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import UserSerializer


@api_view(['GET'])
def user_list(request):
    users = User.objects.all().order_by('-id')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def user_detail(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    if request.method in ['PUT', 'PATCH']:
        username = request.data.get('username')
        email = request.data.get('email')
        full_name = request.data.get('fullName') or request.data.get('name')
        password = request.data.get('password')

        if username is not None:
            user.username = str(username).strip()

        if email is not None:
            user.email = str(email).strip()

        if full_name is not None:
            name_parts = str(full_name).strip().split(' ', 1)
            user.first_name = name_parts[0] if name_parts else ''
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''

        if password:
            user.set_password(password)

        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)

    user.delete()
    return Response({"message": "User deleted successfully"}, status=status.HTTP_200_OK)
