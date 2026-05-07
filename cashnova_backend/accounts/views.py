import base64
import json
import os
import random
import secrets
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.cache import cache
from django.db.models import Q
from django.shortcuts import redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from dotenv import load_dotenv

from .models import AccountProfile, UserPreference
from .serializers import RegisterSerializer

OTP_TIMEOUT_SECONDS = 300
SOCIAL_STATE_TIMEOUT_SECONDS = 600
BACKEND_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=BACKEND_ENV_PATH, override=True)

FRONTEND_SOCIAL_CALLBACK_URL = os.getenv(
    "SOCIAL_AUTH_FRONTEND_CALLBACK_URL",
    "http://127.0.0.1:5173/auth/social-callback",
)
ALLOWED_FRONTEND_CALLBACK_HOSTS = {
    host.strip().lower()
    for host in os.getenv("SOCIAL_AUTH_ALLOWED_CALLBACK_HOSTS", "").split(",")
    if host.strip()
}


@api_view(['GET'])
def test_api(request):
    return Response({"message": "Cashnova backend working"})


def _normalize_otp_identifier(value):
    return str(value or "").strip().lower()


def _get_otp_identifiers(data):
    return [
        identifier
        for identifier in {
            _normalize_otp_identifier(data.get('email')),
            _normalize_otp_identifier(data.get('identifier')),
            _normalize_otp_identifier(data.get('phone')),
            _normalize_otp_identifier(data.get('contactNumber')),
        }
        if identifier
    ]


def _otp_cache_key(identifier):
    return f"cashnova:signup-otp:{identifier}"


@api_view(['POST'])
def register_user(request):
    entered_otp = str(request.data.get('otp') or '').strip()
    identifiers = _get_otp_identifiers(request.data)
    cached_otp = None

    for identifier in identifiers:
        cached_otp = cache.get(_otp_cache_key(identifier))

        if cached_otp:
            break

    if identifiers and not cached_otp:
        return Response({"message": "Please request OTP first"}, status=status.HTTP_400_BAD_REQUEST)

    if cached_otp and entered_otp != str(cached_otp):
        return Response({"message": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        for identifier in identifiers:
            cache.delete(_otp_cache_key(identifier))

        return Response({
            "message": "User registered successfully",
            "user": _serialize_user(user)
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login_user(request):
    identifier = (
        request.data.get('username') or
        request.data.get('email') or
        request.data.get('identifier') or
        request.data.get('phone')
    )
    password = request.data.get('password')
    username = identifier

    matched_user = User.objects.filter(
        Q(username=identifier) |
        Q(email=identifier) |
        Q(cashnova_profile__contact_number=identifier)
    ).first()

    if matched_user:
        username = matched_user.username

    user = authenticate(username=username, password=password)

    if user:
        return Response({
            "message": "Login successful",
            "user": _serialize_user(user)
        }, status=status.HTTP_200_OK)

    return Response({
        "message": "Invalid username or password"
    }, status=status.HTTP_401_UNAUTHORIZED)


def _get_user_from_request(request):
    user_id = (
        request.data.get('user') or
        request.data.get('userId') or
        request.data.get('id') or
        request.query_params.get('user') or
        request.query_params.get('userId') or
        request.query_params.get('id')
    )
    email = request.data.get('email') or request.query_params.get('email')
    username = request.data.get('username') or request.query_params.get('username') or email

    if user_id:
        user = User.objects.filter(id=user_id).first()
        if user:
            return user

    if email:
        user = User.objects.filter(email=email).first()
        if user:
            return user

    if username:
        user = User.objects.filter(username=username).first()
        if user:
            return user

    return User.objects.order_by('-id').first()


def _serialize_user(user):
    if not user:
        return None

    profile, _ = AccountProfile.objects.get_or_create(user=user)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": user.get_full_name() or user.username,
        "fullName": user.get_full_name() or user.username,
        "avatarUrl": profile.avatar_url,
        "profileImage": profile.avatar_url,
        "contactNumber": profile.contact_number,
        "phone": profile.contact_number,
    }


@api_view(['GET', 'PUT', 'PATCH'])
def profile_view(request):
    user = _get_user_from_request(request)

    if not user:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({"user": _serialize_user(user)})

    name = request.data.get('fullName') or request.data.get('name')
    email = request.data.get('email')
    username = request.data.get('username')
    avatar_url = request.data.get('avatarUrl') or request.data.get('profileImage')
    contact_number = request.data.get('contactNumber') or request.data.get('phone')

    if name is not None:
        name_parts = str(name).strip().split(' ', 1)
        user.first_name = name_parts[0] if name_parts else ''
        user.last_name = name_parts[1] if len(name_parts) > 1 else ''

    if email is not None:
        user.email = str(email).strip()

    if username is not None:
        user.username = str(username).strip()

    user.save()

    if avatar_url is not None:
        profile, _ = AccountProfile.objects.get_or_create(user=user)
        profile.avatar_url = str(avatar_url)
        profile.save()

    if contact_number is not None:
        profile, _ = AccountProfile.objects.get_or_create(user=user)
        profile.contact_number = str(contact_number).strip()
        profile.save()

    return Response({
        "message": "Profile updated successfully",
        "user": _serialize_user(user)
    })


@api_view(['POST'])
def change_password(request):
    user = _get_user_from_request(request)

    if not user:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    old_password = request.data.get('oldPassword') or request.data.get('currentPassword')
    new_password = request.data.get('newPassword')
    confirm_password = request.data.get('confirmPassword')

    if not new_password:
        return Response({"message": "New password is required"}, status=status.HTTP_400_BAD_REQUEST)

    if confirm_password and new_password != confirm_password:
        return Response({"message": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

    if old_password and not user.check_password(old_password):
        return Response({"message": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({"message": "Password changed successfully"})


@api_view(['POST'])
def send_otp(request):
    identifiers = _get_otp_identifiers(request.data)

    if not identifiers:
        return Response(
            {"message": "Email or contact number is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    otp = f"{random.randint(0, 999999):06d}"

    for identifier in identifiers:
        cache.set(_otp_cache_key(identifier), otp, OTP_TIMEOUT_SECONDS)

    print(f"Cashnova signup OTP for {', '.join(identifiers)}: {otp}")

    return Response({
        "message": "OTP generated successfully.",
        "otp": otp,
        "expiresInSeconds": OTP_TIMEOUT_SECONDS
    })


@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email') or request.data.get('identifier') or request.data.get('phone')

    if not email:
        return Response({"message": "Email or phone is required"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        "message": "Password reset instructions sent if the account exists"
    })


def _get_social_provider_config(provider):
    load_dotenv(dotenv_path=BACKEND_ENV_PATH, override=True)

    normalized_provider = str(provider or '').strip().lower()

    if normalized_provider == "google":
        redirect_uri = os.getenv(
            "GOOGLE_REDIRECT_URI",
            "http://127.0.0.1:8000/api/auth/google/callback/",
        )

        return {
            "name": "Google",
            "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
            "redirect_uri": redirect_uri,
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
            "scope": "openid email profile",
        }

    if normalized_provider == "microsoft":
        tenant = os.getenv("MICROSOFT_TENANT_ID", "common")
        redirect_uri = os.getenv(
            "MICROSOFT_REDIRECT_URI",
            "http://127.0.0.1:8000/api/auth/microsoft/callback/",
        )

        return {
            "name": "Microsoft",
            "client_id": (
                os.getenv("MICROSOFT_CLIENT_ID", "") or
                os.getenv("AZURE_CLIENT_ID", "") or
                os.getenv("AZURE_AD_CLIENT_ID", "") or
                os.getenv("MS_CLIENT_ID", "")
            ),
            "client_secret": (
                os.getenv("MICROSOFT_CLIENT_SECRET", "") or
                os.getenv("AZURE_CLIENT_SECRET", "") or
                os.getenv("AZURE_AD_CLIENT_SECRET", "") or
                os.getenv("MS_CLIENT_SECRET", "")
            ),
            "redirect_uri": redirect_uri,
            "auth_url": f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
            "token_url": f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
            "graph_me_url": "https://graph.microsoft.com/v1.0/me",
            "scope": "openid email profile User.Read",
        }

    return None


def _is_allowed_frontend_callback_url(url):
    parsed_url = urllib.parse.urlparse(str(url or ""))
    configured_callback = urllib.parse.urlparse(FRONTEND_SOCIAL_CALLBACK_URL)
    allowed_hosts = {
        "localhost",
        "127.0.0.1",
        configured_callback.hostname,
        *ALLOWED_FRONTEND_CALLBACK_HOSTS,
    }

    return (
        parsed_url.scheme in {"http", "https"} and
        parsed_url.hostname and
        parsed_url.hostname.lower() in {host for host in allowed_hosts if host}
    )


def _get_frontend_social_callback_url(request=None, state=""):
    if state:
        cached_url = cache.get(f"cashnova:social-state:{state}")

        if _is_allowed_frontend_callback_url(cached_url):
            return cached_url

    callback_url = ""

    if request is not None:
        callback_url = request.query_params.get("frontend_callback", "")

    if _is_allowed_frontend_callback_url(callback_url):
        return callback_url

    return FRONTEND_SOCIAL_CALLBACK_URL


def _build_frontend_social_redirect(payload=None, error="", frontend_callback_url=""):
    query = {}

    if payload:
        encoded_payload = base64.urlsafe_b64encode(
            json.dumps(payload).encode("utf-8")
        ).decode("utf-8")
        query["payload"] = encoded_payload

        user = payload.get("user") if isinstance(payload, dict) else None

        if isinstance(user, dict):
            if user.get("id"):
                query["user_id"] = user.get("id")

            if user.get("email"):
                query["email"] = user.get("email")

            if user.get("username"):
                query["username"] = user.get("username")

            if user.get("fullName") or user.get("name"):
                query["name"] = user.get("fullName") or user.get("name")

        provider = payload.get("provider") if isinstance(payload, dict) else ""

        if provider:
            query["provider"] = provider

    if error:
        query["error"] = error

    redirect_url = frontend_callback_url or FRONTEND_SOCIAL_CALLBACK_URL

    if query:
        redirect_url = f"{redirect_url}?{urllib.parse.urlencode(query)}"

    return redirect(redirect_url)


def _post_form_json(url, form_data):
    encoded_data = urllib.parse.urlencode(form_data).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=encoded_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    with opener.open(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def _get_bearer_json(url, access_token):
    request = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        method="GET",
    )

    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    with opener.open(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def _format_oauth_error(error):
    if isinstance(error, urllib.error.HTTPError):
        try:
            error_body = error.read().decode("utf-8")
            if error_body:
                return error_body
        except Exception:
            pass

    return str(error)


def _decode_oauth_id_token(id_token):
    parts = str(id_token or "").split(".")

    if len(parts) < 2:
        return {}

    payload = parts[1]
    payload += "=" * ((4 - len(payload) % 4) % 4)

    try:
        decoded_payload = base64.urlsafe_b64decode(payload.encode("utf-8"))
        return json.loads(decoded_payload.decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return {}


def _get_social_user_info(provider, config, access_token, token_payload=None):
    token_payload = token_payload or {}
    id_token_info = _decode_oauth_id_token(token_payload.get("id_token"))
    normalized_provider = str(provider).strip().lower()

    if normalized_provider == "microsoft":
        user_info = id_token_info
    else:
        user_info = {}

    if normalized_provider != "microsoft" or not user_info:
        try:
            fetched_user_info = _get_bearer_json(config["userinfo_url"], access_token)
        except (urllib.error.URLError, urllib.error.HTTPError):
            fetched_user_info = {}
        user_info = {**user_info, **fetched_user_info}

    if normalized_provider == "microsoft" and not (
        user_info.get("email") or
        user_info.get("preferred_username") or
        user_info.get("upn") or
        user_info.get("userPrincipalName") or
        user_info.get("mail") or
        user_info.get("unique_name")
    ):
        try:
            graph_info = _get_bearer_json(config["graph_me_url"], access_token)
        except (urllib.error.URLError, urllib.error.HTTPError):
            graph_info = {}
        user_info.update(graph_info)

    return user_info


def _get_or_create_social_user(provider, user_info):
    emails = user_info.get("emails")
    first_email = emails[0] if isinstance(emails, list) and emails else ""
    microsoft_subject = str(user_info.get("sub") or user_info.get("oid") or user_info.get("id") or "").strip()
    email = (
        user_info.get("email") or
        user_info.get("mail") or
        first_email or
        user_info.get("preferred_username") or
        user_info.get("upn") or
        user_info.get("userPrincipalName") or
        user_info.get("unique_name") or
        ""
    ).strip().lower()
    name = (
        user_info.get("name") or
        user_info.get("displayName") or
        email.split("@")[0] or
        f"{provider.title()} User"
    ).strip()

    if not email and provider == "microsoft" and microsoft_subject:
        email = f"microsoft-{microsoft_subject}"

    if not email:
        raise ValueError("Social provider did not return an email address.")

    user, created = User.objects.get_or_create(
        username=email,
        defaults={"email": email if "@" in email else ""}
    )
    name_parts = name.split(" ", 1)
    user.email = email if "@" in email else user.email
    user.first_name = name_parts[0] if name_parts else ""
    user.last_name = name_parts[1] if len(name_parts) > 1 else ""

    if created:
        user.set_unusable_password()

    user.save()

    picture = user_info.get("picture") or ""

    if picture:
        profile, _ = AccountProfile.objects.get_or_create(user=user)
        profile.avatar_url = picture
        profile.save()

    return user


def _get_or_create_local_social_user(provider, request):
    auth_user = str(request.query_params.get("authuser") or "").strip()
    state = str(request.query_params.get("state") or "").strip()
    identifier = auth_user or state[:10] or "local"
    email = f"{provider}-{identifier}@cashnova.local".lower()
    name = f"{provider.title()} User"

    user, created = User.objects.get_or_create(
        username=email,
        defaults={
            "email": email,
            "first_name": provider.title(),
            "last_name": "User",
        },
    )

    if created:
        user.set_unusable_password()
        user.save()
    elif not user.first_name:
        user.first_name = provider.title()
        user.last_name = "User"
        user.save()

    return user


@api_view(['GET'])
def social_auth(request, provider):
    config = _get_social_provider_config(provider)

    if not config:
        return Response(
            {"message": "Unsupported social login provider"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not config["client_id"] or not config["client_secret"]:
        frontend_callback_url = _get_frontend_social_callback_url(request)

        return _build_frontend_social_redirect(
            error=(
                f"{config['name']} OAuth credentials are missing. "
                "Set client ID and client secret in the backend .env file."
            ),
            frontend_callback_url=frontend_callback_url,
        )

    state = secrets.token_urlsafe(24)
    frontend_callback_url = _get_frontend_social_callback_url(request)
    cache.set(
        f"cashnova:social-state:{state}",
        frontend_callback_url,
        SOCIAL_STATE_TIMEOUT_SECONDS,
    )

    auth_params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": config["scope"],
        "state": state,
        "prompt": "select_account",
    }
    auth_url = f"{config['auth_url']}?{urllib.parse.urlencode(auth_params)}"

    return redirect(auth_url)


@api_view(['GET'])
def social_auth_callback(request, provider):
    config = _get_social_provider_config(provider)
    state = request.query_params.get("state", "")
    frontend_callback_url = _get_frontend_social_callback_url(state=state)

    if not config:
        return _build_frontend_social_redirect(
            error="Unsupported social login provider.",
            frontend_callback_url=frontend_callback_url,
        )

    provider_error = request.query_params.get("error")

    if provider_error:
        return _build_frontend_social_redirect(
            error=provider_error,
            frontend_callback_url=frontend_callback_url,
        )

    code = request.query_params.get("code")

    if not code:
        return _build_frontend_social_redirect(
            error="OAuth code was not returned.",
            frontend_callback_url=frontend_callback_url,
        )

    try:
        token_payload = _post_form_json(
            config["token_url"],
            {
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": config["redirect_uri"],
            },
        )
        access_token = token_payload.get("access_token")

        if not access_token:
            return _build_frontend_social_redirect(
                error="OAuth access token was not returned.",
                frontend_callback_url=frontend_callback_url,
            )

        user_info = _get_social_user_info(provider, config, access_token, token_payload)
        user = _get_or_create_social_user(str(provider).strip().lower(), user_info)

        return _build_frontend_social_redirect(
            payload={
                "provider": str(provider).strip().lower(),
                "user": _serialize_user(user),
            },
            frontend_callback_url=frontend_callback_url,
        )
    except urllib.error.HTTPError as error:
        return _build_frontend_social_redirect(
            error=_format_oauth_error(error),
            frontend_callback_url=frontend_callback_url,
        )
    except urllib.error.URLError:
        if os.getenv("SOCIAL_AUTH_USE_LOCAL_FALLBACK", "False").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }:
            normalized_provider = str(provider).strip().lower()
            user = _get_or_create_local_social_user(normalized_provider, request)

            return _build_frontend_social_redirect(
                payload={
                    "provider": normalized_provider,
                    "user": _serialize_user(user),
                    "warning": (
                        "Social login provider was unreachable, so a local dev "
                        "social user was used."
                    ),
                },
                frontend_callback_url=frontend_callback_url,
            )

        return _build_frontend_social_redirect(
            error="Could not connect to the social login provider.",
            frontend_callback_url=frontend_callback_url,
        )
    except (ValueError, KeyError) as error:
        return _build_frontend_social_redirect(
            error=_format_oauth_error(error),
            frontend_callback_url=frontend_callback_url,
        )


def _serialize_preferences(preferences):
    return {
        "language": preferences.language,
        "currency": preferences.currency,
        "timezone": preferences.timezone,
        "emailNotifications": preferences.email_notifications,
        "aiPredictionAlerts": preferences.ai_prediction_alerts,
        "monthlyReportReminder": preferences.monthly_report_reminder,
    }


@api_view(['GET', 'PUT', 'PATCH'])
def preferences_view(request):
    user = _get_user_from_request(request)

    if not user:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    preferences, _ = UserPreference.objects.get_or_create(user=user)

    if request.method == 'GET':
        return Response(_serialize_preferences(preferences))

    if 'language' in request.data:
        preferences.language = request.data.get('language')

    if 'currency' in request.data:
        preferences.currency = request.data.get('currency')

    if 'timezone' in request.data:
        preferences.timezone = request.data.get('timezone')

    if 'emailNotifications' in request.data:
        preferences.email_notifications = request.data.get('emailNotifications')

    if 'aiPredictionAlerts' in request.data:
        preferences.ai_prediction_alerts = request.data.get('aiPredictionAlerts')

    if 'monthlyReportReminder' in request.data:
        preferences.monthly_report_reminder = request.data.get('monthlyReportReminder')

    preferences.save()

    return Response(_serialize_preferences(preferences))
