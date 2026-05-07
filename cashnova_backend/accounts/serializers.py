from django.contrib.auth.models import User
from rest_framework import serializers

from .models import AccountProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    fullName = serializers.CharField(required=False, write_only=True, allow_blank=True)
    name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    contactNumber = serializers.CharField(required=False, write_only=True, allow_blank=True)
    phone = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'fullName', 'name', 'contactNumber', 'phone']
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        full_name = validated_data.pop('fullName', '') or validated_data.pop('name', '')
        contact_number = validated_data.pop('contactNumber', '') or validated_data.pop('phone', '')
        email = validated_data['email']
        username = validated_data.get('username') or email
        name_parts = str(full_name).strip().split(' ', 1)

        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=name_parts[0] if name_parts else '',
            last_name=name_parts[1] if len(name_parts) > 1 else '',
        )

        if contact_number:
            profile, _ = AccountProfile.objects.get_or_create(user=user)
            profile.contact_number = str(contact_number).strip()
            profile.save()

        return user
