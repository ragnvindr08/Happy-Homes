import os
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

# DRF imports
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_decode

from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from rest_framework import generics
from django.core.cache import cache
from django.utils.crypto import get_random_string
# Standard library imports
import requests
import json

from django.views.generic import TemplateView
class FrontendAppView(TemplateView):
    template_name = 'index.html'
    
# Local app imports
from .models import (
    BillingRecord,
    Review,
    AvailableSlot,
    Post,
    Message,
    Subdivision,
    Pin,
    UserProfile,
    Booking,
    Facility,
    News,
    Alert,
    ContactInfo,
    ContactMessage,
)
from .serializers import (
    BillingSerializer,
    BillingUploadSerializer,
    HistoricalRecordSerializer,
    PostSerializer,
    MessageSerializer,
    SubdivisionSerializer,
    PinSerializer,
    ReviewSerializer,
    UserProfileSerializer,
    UserSerializer,
    BookingSerializer,
    FacilitySerializer,
    AvailableSlotSerializer,
    NewsSerializer,
    AlertSerializer,
    ContactInfoSerializer,
    ContactMessageSerializer,
    HistoricalRecordSerializer
)

from itertools import chain


@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_email(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=400)
    
    code = get_random_string(6, allowed_chars='0123456789')
    cache.set(email, code, timeout=300)  # valid for 5 minutes

    send_mail(
        'Your Verification Code',
        f'Your Happy Homes verification code is: {code}',
        'no-reply@happyhomes.com',
        [email],
        fail_silently=False,
    )

    return Response({'message': 'Verification code sent'})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_code(request):
    email = request.data.get('email')
    code = request.data.get('code')

    if not email or not code:
        return Response({'error': 'Email and code required'}, status=400)

    stored_code = cache.get(email)
    if stored_code == code:
        return Response({'verified': True})
    else:
        return Response({'verified': False}, status=400)
# Get pending verifications
@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_verifications(request):
    pending_profiles = UserProfile.objects.filter(is_verified=False, document__isnull=False)
    data = []
    for profile in pending_profiles:
        data.append({
            'id': profile.user.id,
            'username': profile.user.username,
            'email': profile.user.email,
            'document': profile.document.url if profile.document else None,
            'is_verified': profile.is_verified
        })
    return Response(data)

# Verify user
# Verify user
@api_view(['PUT'])
@permission_classes([IsAdminUser])
def verify_user(request, user_id):
    try:
        profile = UserProfile.objects.get(user__id=user_id)
        profile.is_verified = True
        profile.save()
        return Response({'message': 'User verified successfully'})
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_document(request):
    """
    Allows a user to upload their own document.
    """
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if 'document' not in request.FILES:
        return Response({'detail': 'No document provided.'}, status=400)

    profile.document = request.FILES['document']
    profile.save()

    return Response({'detail': 'Document uploaded successfully.'})

from .serializers import UserAdminSerializer
from django.shortcuts import get_object_or_404

# ✅ Approve (verify) uploaded document
@api_view(['PUT'])
@permission_classes([IsAdminUser])
def verify_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    profile = user.profile  # assumes OneToOne relationship

    if not profile.document:
        return Response({"error": "No document uploaded to verify."}, status=status.HTTP_400_BAD_REQUEST)

    profile.is_verified = True
    profile.save()

    # ✅ Send approval email about verified document
    try:
        send_mail(
            subject="✅ Document Verification Approved - Happy Homes System",
            message=(
                f"Hello {user.username},\n\n"
                f"We have reviewed your submitted verification document, and it has been approved.\n\n"
                f"Your account is now fully verified and you may continue using the system.\n\n"
                f"Thank you for providing a valid document!\n\n"
                f"Best regards,\nHappy Homes Admin Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending approval email: {e}")

    return Response({"detail": "User document verified successfully"})


# ❌ Reject uploaded document
@api_view(['PUT'])
@permission_classes([IsAdminUser])
def reject_user(request, user_id):
    try:
        profile = UserProfile.objects.get(user__id=user_id)
        user = profile.user

        if not profile.document:
            return Response({"error": "No document found to reject."}, status=status.HTTP_400_BAD_REQUEST)

        profile.is_verified = False
        # Optional: remove invalid document from storage
        if profile.document:
            profile.document.delete(save=True)

        profile.save()

        # ✅ Send rejection email
        try:
            send_mail(
                subject="❌ Document Verification Rejected - Happy Homes System",
                message=(
                    f"Hello {user.username},\n\n"
                    f"Unfortunately, your submitted verification document could not be approved.\n"
                    f"Please ensure the uploaded document is clear, complete, and legitimate, then re-upload for review.\n\n"
                    f"If you have any questions, please contact the admin.\n\n"
                    f"Best regards,\nHappy Homes Admin Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending rejection email: {e}")

        return Response({'message': 'User document rejected successfully'})
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    

class UserHistoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = HistoricalRecordSerializer

    def get_queryset(self):
        """
        Combine history from all models that have HistoricalRecords.
        Sort by most recent first.
        """
        qs = list(chain(
            UserProfile.history.all(),
            Post.history.all(),
            Message.history.all(),
            Subdivision.history.all(),
            Pin.history.all(),
            Facility.history.all(),
            Booking.history.all(),
            News.history.all(),
            Alert.history.all(),
            ContactInfo.history.all(),
            ContactMessage.history.all(),
            ResidentPin.history.all(),
            Visitor.history.all(),
        ))

        # Sort by history_date descending
        qs_sorted = sorted(qs, key=lambda x: x.history_date, reverse=True)
        return qs_sorted

@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ allow anyone
def send_email(request):
    data = request.data
    subject = data.get('subject')
    message = data.get('message')
    recipient = data.get('recipient')

    if not subject or not message or not recipient:
        return Response({"error": "subject, message, and recipient are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        return Response({"success": "Email sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required."}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"message": "If the email exists, a reset link will be sent."}, status=200)  # do not reveal

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    subject = "Reset Your Password"
    message = f"Hi {user.username},\n\nClick the link below to reset your password:\n{reset_link}\n\nIf you didn't request this, ignore this email."
    
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

    return Response({"message": "If the email exists, a reset link will be sent."})
    
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not uidb64 or not token or not new_password:
        return Response({"error": "All fields are required."}, status=400)

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid link"}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({"error": "Invalid or expired token."}, status=400)

    user.set_password(new_password)
    user.save()

    return Response({"message": "Password reset successful."}, status=200)

# Pin statistics for dashboard
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pin_stats(request):
    total_pins = Pin.objects.count()
    # Consider either explicit status or legacy name marker
    occupied = Pin.objects.filter(Q(status__iexact="occupied") | Q(name__icontains="occupied")).count()
    # Use fixed capacity of 200 slots for subdivision capacity
    capacity = 200
    max_subdivisions = capacity
    available = max(capacity - occupied, 0)
    return Response({
        "total_pins": total_pins,
        "occupied": occupied,
        "available": available,
        "max_subdivisions": max_subdivisions
    })

# Admin dashboard stats endpoint
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    total_users = User.objects.count()
    active_bookings = Booking.objects.filter(status="approved").count()
    pending_approvals = Booking.objects.filter(status="pending").count()
    return Response({
        "total_users": total_users,
        "active_bookings": active_bookings,
        "pending_approvals": pending_approvals
    })

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response({"detail": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Keep user logged in after password change
        update_session_auth_hash(request, user)

        return Response({"detail": "Password updated successfully!"}, status=status.HTTP_200_OK)

# Admin-only user list
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

# Admin can delete a user
@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_user_delete(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if user.is_superuser:
            return Response({'detail': 'Cannot delete superuser.'}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response({'detail': 'User deleted.'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

# Admin can update a user (basic fields)
@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_user_update(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)
    user.username = request.data.get('username', user.username)
    user.is_staff = request.data.get('is_staff', user.is_staff)
    user.save()

    serializer = UserSerializer(user, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_detail(request, pk):
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserSerializer(user, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data

    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()  # normalize email
    password = data.get('password', '')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    contact_number = data.get('contact_number', '')

    # ✅ Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Check if email already exists
    if email and User.objects.filter(email=email).exists():
        return Response({'detail': 'This email is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Create user
    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name,
        email=email
    )

    # ✅ Create or update user profile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.contact_number = contact_number
    profile.save()

    # ✅ Serialize and return tokens
    serializer = UserSerializer(user)
    refresh = RefreshToken.for_user(user)

    return Response({
        'user': serializer.data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_201_CREATED)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_user(request, id):
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=404)

    # Update basic user info
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)
    user.username = request.data.get('username', user.username)
    user.save()

    # Update profile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile_data = request.data.get('profile', {})

    profile.contact_number = profile_data.get('contact_number', profile.contact_number)

    # Update verification status if provided
    if 'is_verified' in profile_data:
        profile.is_verified = profile_data['is_verified']

    # Update profile image if provided
    if 'profile_image' in request.FILES:
        profile.profile_image = request.FILES['profile_image']

    # Update document if provided
    if 'document' in request.FILES:
        profile.document = request.FILES['document']

    profile.save()

    return Response({'detail': 'User updated successfully'})
# --- Register ---
# @api_view(['POST'])
# @permission_classes([AllowAny])
# def register(request):
#     data = request.data
#     if User.objects.filter(username=data.get('username')).exists():
#         return Response({'detail': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

#     user = User.objects.create_user(
#         username=data.get('username'),
#         password=data.get('password'),
#         first_name=data.get('first_name', ''),
#         last_name=data.get('last_name', ''),
#         email=data.get('email', '')
#     )

    

#     # Create UserProfile and save contact_number
#     contact_number = data.get('contact_number', '')
#     profile, created = UserProfile.objects.get_or_create(user=user)
#     profile.contact_number = contact_number
#     profile.save()

#     serializer = UserSerializer(user)
#     refresh = RefreshToken.for_user(user)

#     return Response({
#         'user': serializer.data,
#         'access': str(refresh.access_token),
#         'refresh': str(refresh),
#     })


# --- Posts ---
@api_view(['GET'])
def get_posts(request):
    posts = Post.objects.all()
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_posts(request):
    posts = Post.objects.filter(user=request.user)
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)

# --- Profile GET ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# --- Profile UPDATE (with image) ---
# ✅ Update profile (name, email, password, image, etc.)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)

    # Update User fields
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)
    user.username = request.data.get('username', user.username)
    if 'password' in request.data and request.data['password']:
        user.set_password(request.data['password'])
    user.save()

    # Update UserProfile fields (IMPORTANT: include contact_number)
    profile.contact_number = request.data.get('contact_number', profile.contact_number)
    if 'profile_image' in request.FILES:
        profile.profile_image = request.FILES['profile_image']
    profile.save()

    # Refresh both user and profile to ensure updated data
    user.refresh_from_db()
    profile.refresh_from_db()

    # Serialize full user including profile
    serializer = UserSerializer(user, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


# --- Messenger (temporary) ---
@api_view(['GET', 'POST'])
def message_list_create(request):
    if request.method == 'GET':
        messages = Message.objects.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# --- Subdivisions ---
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subdivision_list_create(request):
    if request.method == 'GET':
        subdivisions = Subdivision.objects.all()
        serializer = SubdivisionSerializer(subdivisions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SubdivisionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def subdivision_detail(request, pk):
    try:
        subdivision = Subdivision.objects.get(pk=pk)
    except Subdivision.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SubdivisionSerializer(subdivision)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = SubdivisionSerializer(subdivision, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        subdivision.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class FacilityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    authentication_classes = []  # allow public
    permission_classes = [AllowAny]

class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission to only allow admins or the owner of the object to access it.
    """
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.user == request.user

from rest_framework.exceptions import PermissionDenied
class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_queryset(self):
        facility_id = self.request.query_params.get("facility_id")

        # Admins can see all bookings
        if self.request.user.is_staff:
            qs = Booking.objects.all()
        else:
            qs = Booking.objects.filter(user=self.request.user)

        if facility_id:
            qs = qs.filter(facility_id=facility_id)

        return qs.order_by("date", "start_time")

    def perform_create(self, serializer):
        user = self.request.user
        profile = getattr(user, "profile", None)

        if not profile or not profile.is_verified:
            raise PermissionDenied( 
                detail="Your account is not verified. "
                       "Please upload your documents and wait for admin approval before booking."
            )

        # ✅ Proceed if verified
        serializer.save(user=user)

    # Utility: format time
    def format_time_am_pm(self, time_str: str) -> str:
        try:
            time_obj = datetime.strptime(time_str, "%H:%M:%S")
            return time_obj.strftime("%I:%M %p")
        except Exception:   
            return time_str

    # Partial update to send email when status changes
    def partial_update(self, request, *args, **kwargs):
        booking = self.get_object()
        old_status = booking.status
        response = super().partial_update(request, *args, **kwargs)
        booking.refresh_from_db()

        if old_status != booking.status:
            user_email = booking.user.email
            if user_email:
                start_time = self.format_time_am_pm(str(booking.start_time))
                end_time = self.format_time_am_pm(str(booking.end_time))

                subject = f"Booking {booking.status.capitalize()} - {booking.facility.name}"
                message = (
                    f"Hello {booking.user.first_name or booking.user.username},\n\n"
                    f"Your booking for {booking.facility.name} on {booking.date.strftime('%B %d, %Y')} "
                    f"from {start_time} to {end_time} has been "
                    f"{booking.status.upper()} by the admin.\n\n"
                    f"You can view your booking status here: {settings.FRONTEND_URL}/my-bookings\n\n"
                    f"Thank you,\nHappy Homes Admin"
                )

                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [user_email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"❌ Email sending failed: {e}")

        return response

# --- Available Slot ViewSet (All users can view, only admins can manage) ---
class AvailableSlotViewSet(viewsets.ModelViewSet):
    serializer_class = AvailableSlotSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]  # All authenticated users can view

    def get_queryset(self):
        facility_id = self.request.query_params.get("facility_id")
        qs = AvailableSlot.objects.all()
        
        if facility_id:
            qs = qs.filter(facility_id=facility_id)
        
        return qs.order_by("date", "start_time")

    def get_permissions(self):
        """
        Allow all authenticated users to view (GET, LIST),
        but only admins can create, update, or delete.
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

# class BookingViewSet(viewsets.ModelViewSet):
#     serializer_class = BookingSerializer
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsAdminOrOwner]

#     def get_queryset(self):
#         facility_id = self.request.query_params.get('facility_id')
#         if self.request.user.is_staff:
#             qs = Booking.objects.all()
#         else:
#             qs = Booking.objects.filter(user=self.request.user)

#         if facility_id:
#             qs = qs.filter(facility_id=facility_id)

#         return qs.order_by("date", "start_time")

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)

class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all().order_by('-created_at')
    serializer_class = NewsSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        news = serializer.save()
        # Send email to all users
        recipients = list(User.objects.values_list('email', flat=True))
        send_mail(
            subject=f"📰 New News: {news.title}",
            message=f"{news.content}\n\nView on site.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=True,
        )


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        alert = serializer.save()
        # Send email to all users
        recipients = list(User.objects.values_list('email', flat=True))
        send_mail(
            subject=f"🚨 New Alert: {alert.title}",
            message=f"Severity: {alert.severity}\n\n{alert.message}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=True,
        )
# --- News ---
# class NewsViewSet(viewsets.ModelViewSet):
#     queryset = News.objects.all().order_by('-created_at')
#     serializer_class = NewsSerializer
#     permission_classes = [IsAuthenticatedOrReadOnly]


# # --- Alerts ---
# class AlertViewSet(viewsets.ModelViewSet):
#     queryset = Alert.objects.all().order_by('-created_at')
#     serializer_class = AlertSerializer
#     permission_classes = [IsAuthenticatedOrReadOnly]


# --- Contact Info (singleton style, first row) ---
class ContactInfoViewSet(viewsets.ModelViewSet):
    queryset = ContactInfo.objects.all()
    serializer_class = ContactInfoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs[:1]


# --- Contact Messages ---
class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        instance = serializer.save()
        # Send notification email to default admin inbox
        from django.core.mail import send_mail
        subject = f"New contact message: {instance.subject}"
        body = f"From: {instance.name} <{instance.email}>\n\n{instance.message}"
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [getattr(settings, 'CONTACT_INBOX_EMAIL', settings.DEFAULT_FROM_EMAIL)],
            fail_silently=True,
        )

# --- ViewSets ---
@method_decorator(csrf_exempt, name='dispatch')
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        pin_id = self.request.query_params.get("pin_id")
        qs = Review.objects.all()
        
        if pin_id:
            qs = qs.filter(pin_id=pin_id)
        
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        # Ensure user can only create one review per pin
        pin = serializer.validated_data['pin']
        user = self.request.user
        
        # Check if review already exists
        existing_review = Review.objects.filter(pin=pin, user=user).first()
        if existing_review:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You have already reviewed this location. You can update your existing review.")
        
        serializer.save(user=user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PinViewSet(ModelViewSet):
    queryset = Pin.objects.all()
    serializer_class = PinSerializer
    # Temporarily allow open write access to unblock pinning; tighten later
    permission_classes = [AllowAny]
    authentication_classes = []

    def perform_create(self, serializer):
        # Ensure optional fields are saved from incoming payload
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()


@method_decorator(csrf_exempt, name='dispatch')
class SubdivisionViewSet(ModelViewSet):
    queryset = Subdivision.objects.all()
    serializer_class = SubdivisionSerializer
    permission_classes = [AllowAny]
    authentication_classes = [BasicAuthentication]

    @action(detail=False, methods=['get'])
    def occupancy_stats(self, request):
        """Get real-time subdivision occupancy statistics based on pins"""
        # Get all pins
        all_pins = Pin.objects.all()
        total_pins = all_pins.count()
        
        # Count occupied pins (prefer status, fallback to legacy name marker)
        occupied_pins = all_pins.filter(
            Q(status__iexact='occupied') |
            Q(name__iregex=r'(^|\b)occupied($|\b)')
        ).count()
        available_pins = max(total_pins - occupied_pins, 0)
        
        # Use fixed capacity of 200 slots for subdivision capacity
        capacity = 200
        max_subdivisions = capacity
        total_subdivisions = capacity
        occupied_subdivisions = occupied_pins
        available_subdivisions = max(total_subdivisions - occupied_subdivisions, 0)
        
        return Response({
            'total': total_subdivisions,
            'occupied': occupied_subdivisions,
            'available': available_subdivisions,
            'occupancy_rate': (occupied_subdivisions / total_subdivisions * 100) if total_subdivisions > 0 else 0,
            'total_pins': total_pins,
            'occupied_pins': occupied_pins,
            'available_pins': available_pins
        })

    @action(detail=False, methods=['get'])
    def real_time_data(self, request):
        """Get real-time data for map including pins and occupancy"""
        # Get all pins
        pins = Pin.objects.all()
        pin_serializer = PinSerializer(pins, many=True)
        
        # Calculate occupancy stats based on pins
        total_pins = pins.count()
        occupied_pins = pins.filter(
            Q(status__iexact='occupied') |
            Q(name__iregex=r'(^|\b)occupied($|\b)')
        ).count()
        available_pins = max(total_pins - occupied_pins, 0)
        
        # Use fixed capacity of 200 slots for subdivision capacity
        capacity = 200
        max_subdivisions = capacity
        total_subdivisions = capacity
        occupied_subdivisions = occupied_pins
        available_subdivisions = max(total_subdivisions - occupied_subdivisions, 0)
        
        return Response({
            'pins': pin_serializer.data,
            'occupancy': {
                'total': total_subdivisions,
                'occupied': occupied_subdivisions,
                'available': available_subdivisions,
                'occupancy_rate': (occupied_subdivisions / total_subdivisions * 100) if total_subdivisions > 0 else 0,
                'total_pins': total_pins,
                'occupied_pins': occupied_pins,
                'available_pins': available_pins
            },
            'timestamp': timezone.now().isoformat()
        })


# --- reCAPTCHA ---
@csrf_exempt
def verify_recaptcha(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        recaptcha_token = data.get('recaptcha')

        if not recaptcha_token:
            return JsonResponse({'message': 'reCAPTCHA token missing'}, status=400)

        secret_key = settings.RECAPTCHA_SECRET_KEY
        payload = {'secret': secret_key, 'response': recaptcha_token}
        response = requests.post("https://www.google.com/recaptcha/api/siteverify", data=payload)
        result = response.json()

        if not result.get('success'):
            return JsonResponse({'message': 'reCAPTCHA verification failed'}, status=400)

        # Example login check (replace with your own logic)
        username = data.get('username')
        password = data.get('password')
        if username == 'test' and password == 'password':
            return JsonResponse({'access': 'fake-jwt-token'}, status=200)

        return JsonResponse({'message': 'Invalid username or password'}, status=400)

    return JsonResponse({'message': 'Invalid request method'}, status=405)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_verification_document(request):
    profile = request.user.profile
    file = request.FILES.get('document')
    if not file:
        return Response({"error": "No document uploaded"}, status=400)

    profile.document = file
    profile.is_verified = False  # Set to False initially; admin will verify later
    profile.save()
    return Response({"message": "Document uploaded successfully!"})

from .models import ResidentPin, Visitor
from .serializers import ResidentPinSerializer, VisitorSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.http import HttpResponse

# ✅ Resident PIN (GET/POST)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_resident_pin(request):
    user = request.user
    pin_obj, _ = ResidentPin.objects.get_or_create(user=user)

    if request.method == "POST":
        pin_obj.generate_pin()

    serializer = ResidentPinSerializer(pin_obj)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def visitor_checkin(request):
    serializer = VisitorSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def guest_visitor_checkin(request):
    name = request.data.get('name')
    gmail = request.data.get('gmail')
    contact_number = request.data.get('contact_number', None)
    pin = request.data.get('pin')
    reason = request.data.get('reason', '')

    # Validate required fields
    if not name or not gmail or not pin:
        return Response({"error": "Missing name, gmail, or resident PIN"}, status=400)

    try:
        resident = ResidentPin.objects.get(pin=pin)
    except ResidentPin.DoesNotExist:
        return Response({"error": "Invalid resident PIN"}, status=404)

    visitor = Visitor.objects.create(
        name=name,
        gmail=gmail,
        contact_number=contact_number,  # Optional
        reason=reason,
        resident=resident,
        status='pending'
    )

    # ✅ Send Gmail notification to resident
    if resident.user.email:
        send_mail(
            subject="🆕 New Visitor Check-In Pending Approval",
            message=(
                f"Hello {resident.user.username},\n\n"
                f"A new visitor has submitted a check-in request.\n"
                f"Details:\n"
                f"Name: {name}\n"
                f"Gmail: {gmail}\n"
                f"Contact: {contact_number or '-'}\n"
                # f"Reason: {reason or '-'}\n\n"
                f"Please approve or decline this visitor in the dashboard."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[resident.user.email],
            fail_silently=True,
        )

    serializer = VisitorSerializer(visitor)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
# @api_view(['POST'])
# @permission_classes([AllowAny])
# def guest_visitor_checkin(request):
#     name = request.data.get('name')
#     gmail = request.data.get('gmail')
#     contact_number = request.data.get('contact_number', None)
#     pin = request.data.get('pin')
#     reason = request.data.get('reason', '')

#     if not name or not gmail or not pin:
#         return Response({"error": "Missing name, gmail, or resident PIN"}, status=400)

#     try:
#         resident = ResidentPin.objects.get(pin=pin)
#     except ResidentPin.DoesNotExist:
#         return Response({"error": "Invalid resident PIN"}, status=404)

#     visitor = Visitor.objects.create(
#         name=name,
#         gmail=gmail,
#         contact_number=contact_number,
#         reason=reason,
#         resident=resident,
#         status='pending'
#     )
#     serializer = VisitorSerializer(visitor)
#     return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def visitor_approval(request, visitor_id):
    approve = request.data.get("approve", False)

    try:
        visitor = Visitor.objects.get(id=visitor_id)
    except Visitor.DoesNotExist:
        return Response({"error": "Visitor not found"}, status=404)

    visitor.status = "approved" if approve else "declined"
    if approve:
        visitor.time_in = timezone.now()
    visitor.save()

    # ✅ Notify resident
    if visitor.resident.user.email:
        send_mail(
            subject="✅ Visitor Approved" if approve else "❌ Visitor Declined",
            message=(
                f"Visitor {visitor.name} has been {'approved' if approve else 'declined'} "
                f"by {visitor.resident.user.username}."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[visitor.resident.user.email],
            fail_silently=True,
        )

    # ✅ Notify visitor if approved
    if approve and visitor.gmail:
        send_mail(
            subject="✅ Your Visitor Check-In Has Been Approved",
            message=(
                f"Hello {visitor.name},\n\n"
                f"Your visitor check-in has been approved by {visitor.resident.user.username}.\n"
                f"Details:\n"
                f"Name: {visitor.name}\n"
                f"Gmail: {visitor.gmail}\n"
                f"Contact: {visitor.contact_number or '-'}\n"
                f"Reason: {visitor.reason or '-'}\n\n"
                f"Time In: {visitor.time_in}\n"
                f"Enjoy your visit!"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[visitor.gmail],
            fail_silently=True,
        )

    serializer = VisitorSerializer(visitor)
    return Response(serializer.data)


# ✅ Visitor check-out
@api_view(['POST'])
@permission_classes([AllowAny])
def visitor_checkout(request, visitor_id):
    try:
        visitor = Visitor.objects.get(id=visitor_id)
    except Visitor.DoesNotExist:
        return Response({"error": "Visitor not found"}, status=404)

    if visitor.status != "approved":
        return Response({"error": "Cannot check out unapproved visitor"}, status=400)

    visitor.time_out = timezone.now()
    visitor.save()

    # Notify resident
    if visitor.resident and visitor.resident.user.email:
        send_mail(
            subject="🚪 Visitor Checked Out",
            message=f"Visitor {visitor.name} has checked out successfully.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[visitor.resident.user.email],
            fail_silently=True,
        )

    # Notify visitor
    if visitor.gmail:
        send_mail(
            subject="You Checked Out",
            message=f"Hello {visitor.name}, you have successfully checked out.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[visitor.gmail],
            fail_silently=True,
        )

    serializer = VisitorSerializer(visitor)
    return Response(serializer.data)
# ✅ Visitor approval (resident)
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def visitor_approval(request, visitor_id):
#     approve = request.data.get("approve", False)

#     try:
#         visitor = Visitor.objects.get(id=visitor_id)
#     except Visitor.DoesNotExist:
#         return Response({"error": "Visitor not found"}, status=404)

#     visitor.status = "approved" if approve else "declined"
#     if approve:
#         visitor.time_in = timezone.now()
#     visitor.save()

#     # ✅ Send Gmail notification to resident
#     if visitor.resident.user.email:
#         send_mail(
#             subject="✅ Visitor Approved" if approve else "❌ Visitor Declined",
#             message=(
#                 f"Visitor {visitor.name} has been {'approved' if approve else 'declined'} "
#                 f"by {visitor.resident.user.username}."
#             ),
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             recipient_list=[visitor.resident.user.email],
#             fail_silently=True,
#         )

#     serializer = VisitorSerializer(visitor)
#     return Response(serializer.data)


# ✅ Visitor check-out
@api_view(['POST'])
@permission_classes([AllowAny])
def visitor_checkout(request, visitor_id):
    try:
        visitor = Visitor.objects.get(id=visitor_id)
    except Visitor.DoesNotExist:
        return Response({"error": "Visitor not found"}, status=404)

    if visitor.status != "approved":
        return Response({"error": "Cannot check out unapproved visitor"}, status=400)

    visitor.time_out = timezone.now()
    visitor.save()

    # ✅ Send Gmail notification to resident
    if visitor.resident.user.email:
        send_mail(
            subject="🚪 Visitor Checked Out",
            message=f"Visitor {visitor.name} has checked out successfully.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[visitor.resident.user.email],
            fail_silently=True,
        )

    serializer = VisitorSerializer(visitor)
    return Response(serializer.data)


# ✅ Active visitors
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_visitors(request):
    visitors = Visitor.objects.filter(
        resident__user=request.user,
        time_out__isnull=True,
        status="approved"
    )
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)


# ✅ Pending visitors
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_visitors(request):
    visitors = Visitor.objects.filter(
        resident__user=request.user,
        status="pending"
    )
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)


class VisitorViewSet(viewsets.ModelViewSet):
    serializer_class = VisitorSerializer

    def get_queryset(self):
        """
        Return visitors for the logged-in resident.
        Guests (anonymous) will use direct PK lookup in time_in/time_out.
        """
        user = self.request.user
        if user.is_authenticated:
            return Visitor.objects.filter(resident__user=user).order_by('-time_in')
        # For anonymous users, allow all visitors (used only in time_in/time_out)
        return Visitor.objects.all()

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        visitor = self.get_object()
        visitor.status = "approved"
        visitor.time_in = now()
        visitor.save()
        return Response({"message": "Visitor approved."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def decline(self, request, pk=None):
        visitor = self.get_object()
        visitor.status = "declined"
        visitor.time_out = now()
        visitor.save()
        return Response({"message": "Visitor declined."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[AllowAny], url_path='time-in')
    def time_in(self, request, pk=None):
        """
        Update visitor time-in. Allows guests to check in using visitor ID.
        """
        visitor = Visitor.objects.get(pk=pk)  # Direct lookup, bypass user filter
        visitor.time_in = now()
        visitor.save()
        return Response({"time_in": visitor.time_in}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[AllowAny], url_path='time-out')
    def time_out(self, request, pk=None):
        """
        Update visitor time-out. Allows guests to check out using visitor ID.
        """
        visitor = Visitor.objects.get(pk=pk)  # Direct lookup
        visitor.time_out = now()
        visitor.save()
        return Response({"time_out": visitor.time_out}, status=status.HTTP_200_OK)
# ✅ Optional ModelViewSets
# class VisitorViewSet(viewsets.ModelViewSet):
#     queryset = Visitor.objects.all().order_by('-time_in')
#     serializer_class = VisitorSerializer

#     def get_permissions(self):
#         if self.action in ['create', 'check_status']:
#             return [AllowAny()]
#         return [IsAuthenticated()]

#     def get_queryset(self):
#         queryset = super().get_queryset()
#         gmail = self.request.query_params.get("gmail")
#         if gmail:
#             queryset = queryset.filter(gmail=gmail)
#         return queryset

#     def create(self, request):
#         """Visitor check-in (public)"""
#         name = request.data.get("name")
#         email = request.data.get("email")
#         pin_entered = request.data.get("pin")

#         try:
#             resident_pin = ResidentPin.objects.get(pin=pin_entered)
#         except ResidentPin.DoesNotExist:
#             return Response({"error": "Invalid PIN"}, status=400)

#         visitor = Visitor.objects.create(
#             name=name,
#             email=email,
#             resident=resident_pin.user,
#             pin=pin_entered,
#             status="PENDING"
#         )

#         serializer = VisitorSerializer(visitor)
#         return Response(serializer.data, status=201)

#     @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
#     def approve(self, request, pk=None):
#         """Resident approves visitor"""
#         visitor = self.get_object()
#         visitor.status = "APPROVED"
#         visitor.time_in = timezone.now()
#         visitor.save()
#         visitor.notify_status_change()  # ✅ send Gmail
#         return Response({"message": "Visitor approved and notified."})

#     @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
#     def decline(self, request, pk=None):
#         """Resident declines visitor"""
#         visitor = self.get_object()
#         visitor.status = "DECLINED"
#         visitor.save()
#         visitor.notify_status_change()  # ✅ send Gmail
#         return Response({"message": "Visitor declined and notified."})

#     @action(detail=False, methods=["post"], permission_classes=[AllowAny])
#     def check_status(self, request):
#         """Visitors can check their status using email + PIN"""
#         email = request.data.get("email")
#         pin = request.data.get("pin")

#         visitor = Visitor.objects.filter(email=email, pin=pin).order_by('-time_in').first()
#         if not visitor:
#             return Response({"status": "Not found"}, status=404)
#         return Response({"status": visitor.status})


class ResidentPinViewSet(viewsets.ModelViewSet):
    queryset = ResidentPin.objects.all()
    serializer_class = ResidentPinSerializer
    permission_classes = [IsAuthenticated]

class ResidentApprovalViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.select_related('user').all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        """Allow admin to approve or decline a resident."""
        profile = self.get_object()
        is_verified = request.data.get('is_verified', None)

        if is_verified is not None:
            profile.is_verified = is_verified
            profile.save()
            return Response({
                "message": f"Resident {'approved ✅' if is_verified else 'declined ❌'} successfully."
            }, status=status.HTTP_200_OK)

        return Response({"error": "is_verified field required"}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_visitors(request):
    visitors = Visitor.objects.filter(resident__user=request.user)
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)


class VisitorListView(generics.ListAPIView):
    serializer_class = VisitorSerializer

    def get_queryset(self):
        gmail = self.request.query_params.get("gmail")
        if gmail:
            return Visitor.objects.filter(gmail=gmail)
        return Visitor.objects.all()

def guest_visitors(request):
    email = request.query_params.get('email')
    visitors = Visitor.objects.filter(email=email)
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)

class VisitorCheckinView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VisitorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(status="pending")  # set status server-side
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
def visitor_status(request):
    name = request.GET.get('name')
    gmail = request.GET.get('gmail')
    pin = request.GET.get('pin')

    if not all([name, gmail, pin]):
        return Response({"error": "Missing parameters"}, status=400)

    visitors = Visitor.objects.filter(
        name=name,
        gmail=gmail,
        resident__pin=pin
    )
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)


# Guest visitor status check
@api_view(['GET'])
@permission_classes([AllowAny])
def guest_visitor_status(request):
    name = request.GET.get('name')
    gmail = request.GET.get('gmail')
    pin = request.GET.get('pin')

    if not name or not gmail or not pin:
        return Response({"error": "Missing name, gmail, or resident PIN"}, status=400)

    try:
        resident = ResidentPin.objects.get(pin=pin)
    except ResidentPin.DoesNotExist:
        return Response({"error": "Invalid resident PIN"}, status=404)

    visitors = Visitor.objects.filter(resident=resident, name=name, gmail=gmail)
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resident_visitors(request):
    """
    Returns all visitor requests for the logged-in resident.
    """
    user = request.user
    # Assuming Resident PIN is linked to user
    visitor_requests = Visitor.objects.filter(resident__user=user)
    serializer = VisitorSerializer(visitor_requests, many=True)
    return Response(serializer.data)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def visitor_timeout(request, pk):
    try:
        visitor = Visitor.objects.get(id=pk)
        visitor.time_out = timezone.now()
        visitor.save()
        return Response({"detail": "Time out updated."})
    except Visitor.DoesNotExist:
        return Response({"detail": "Visitor not found."}, status=404)

from django.utils.timezone import now

class VisitorTrackingViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all().order_by("-time_in")
    serializer_class = VisitorSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        visitor = self.get_object()
        visitor.status = "approved"
        visitor.time_in = now()
        visitor.save()
        return Response({"message": "Visitor approved."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def decline(self, request, pk=None):
        visitor = self.get_object()
        visitor.status = "declined"
        visitor.time_out = now()
        visitor.save()
        return Response({"message": "Visitor declined."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def timeout(self, request, pk=None):
        visitor = self.get_object()
        visitor.time_out = now()  # ✅ Make sure now() is imported
        visitor.save()
        return Response({"message": "Visitor time-out recorded."}, status=status.HTTP_200_OK)

from .models import House
from .serializers import HouseSerializer   
from rest_framework.authentication import TokenAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

class HouseListCreateView(generics.ListCreateAPIView):
    queryset = House.objects.all().order_by("-created_at")
    serializer_class = HouseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HouseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        # Prevent switching owners
        serializer.save(user=self.request.user)


class HouseViewSet(viewsets.ModelViewSet):
    serializer_class = HouseSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return House.objects.all().order_by('-created_at')
        return House.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# -----------------------------------------
# GUEST VIEWS (READ ONLY)
# -----------------------------------------

class GuestHouseListView(generics.ListAPIView):
    """Allows non-logged-in users to view all houses."""
    queryset = House.objects.all().order_by("-created_at")
    serializer_class = HouseSerializer
    permission_classes = [AllowAny]  # 👈 Guest access


class GuestHouseDetailView(generics.RetrieveAPIView):
    """Allows non-logged-in users to view a single house."""
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    permission_classes = [AllowAny]

from .models import Billing
# views.py
# Upload Billing (User)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_billing(request):
    file = request.FILES.get('billing')
    if not file:
        return Response({'error': 'No file uploaded'}, status=400)

    billing = Billing.objects.create(user_profile=request.user.profile, file=file)
    serializer = BillingSerializer(billing, context={'request': request})
    return Response(serializer.data)

# Fetch all users with billing records
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_bills(request):
    users = User.objects.prefetch_related('billing_records').all()
    data = []
    for user in users:
        data.append({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "profile": {
                "billing_records": [b.file.url for b in user.billing_records.all()]
            }
        })
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_billing(request):
    user = request.user

    billing_id = request.data.get("id")
    if not billing_id:
        return Response({"error": "Billing ID is required"}, status=400)

    try:
        billing = Billing.objects.get(id=billing_id, user_profile=user.profile)
    except Billing.DoesNotExist:
        return Response({"error": "Billing not found"}, status=404)

    # Delete file from storage
    if billing.file and billing.file.name:
        billing.file.delete(save=False)

    billing.delete()
    return Response({"success": "Billing record deleted"})
# --- Simple user info (legacy) ---
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_user_profile(request):
#     user = request.user
    
#     return Response({
#         'username': user.username,
#         'email': user.email,
#         'first_name': user.first_name,
#         'last_name': user.last_name,
#         'is_staff': user.is_staff,
#     })

# import json
# import requests
# from core import settings  # Correct the import
# from rest_framework import status, viewsets
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from rest_framework.response import Response
# from django.contrib.auth.models import User
# from rest_framework_simplejwt.tokens import RefreshToken
# from .models import Post, Message, Subdivision, Pin
# from .serializers import PostSerializer, MessageSerializer, SubdivisionSerializer, PinSerializer, UserSerializer
# from rest_framework.authentication import SessionAuthentication, BasicAuthentication
# from django.utils.decorators import method_decorator
# from django.views.decorators.csrf import csrf_exempt
# from rest_framework.viewsets import ModelViewSet
# from rest_framework_simplejwt.authentication import JWTAuthentication
# from django.http import JsonResponse




# @api_view(['POST'])
# def register(request):
#     data = request.data
#     if User.objects.filter(username=data.get('username')).exists():
#         return Response({'detail': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

#     user = User.objects.create_user(
#         username=data.get('username'),
#         password=data.get('password'),
#         first_name=data.get('first_name', ''),
#         last_name=data.get('last_name', ''),
#         email=data.get('email', '')
        
#     )

#     serializer = UserSerializer(user)
#     refresh = RefreshToken.for_user(user)

#     return Response({
#         'user': serializer.data,
#         'access': str(refresh.access_token),
#         'refresh': str(refresh),
#     })

# @api_view(['GET'])
# def get_posts(request):
#     posts = Post.objects.all()
#     serializer = PostSerializer(posts, many=True)
#     return Response(serializer.data)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_user_posts(request):
#     posts = Post.objects.filter(user=request.user)
#     serializer = PostSerializer(posts, many=True)
#     return Response(serializer.data)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_user_profile(request):
#     user = request.user
#     return Response({
#         'username': user.username,
#         'email': user.email,
#         'first_name': user.first_name,
#         'last_name': user.last_name,
#         'is_staff': user.is_staff,
#     })

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def profile(request):
#     user = request.user
#     serializer = UserSerializer(user)
#     return Response(serializer.data)

# @api_view(['PUT'])
# @permission_classes([IsAuthenticated])
# def update_user_profile(request):
#     user = request.user
#     data = request.data

#     # Update fields if provided
#     user.first_name = data.get('first_name', user.first_name)
#     user.last_name = data.get('last_name', user.last_name)
#     user.email = data.get('email', user.email)
#     user.username = data.get('username', user.username)
    
#     user.save()

#     return Response({
#         'username': user.username,
#         'email': user.email,
#         'first_name': user.first_name,
#         'last_name': user.last_name,
#         'is_staff': user.is_staff,
#     })

# #messenger naten temporary lang
# @api_view(['GET', 'POST'])
# def message_list_create(request):
#     if request.method == 'GET':
#         messages = Message.objects.all().order_by('timestamp')
#         serializer = MessageSerializer(messages, many=True)
#         return Response(serializer.data)

#     if request.method == 'POST':
#         serializer = MessageSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=201)
#         return Response(serializer.errors, status=400)
    
# @api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])
# def subdivision_list_create(request):
#     if request.method == 'GET':
#         subdivisions = Subdivision.objects.all()
#         serializer = SubdivisionSerializer(subdivisions, many=True)
#         return Response(serializer.data)

#     elif request.method == 'POST':
#         serializer = SubdivisionSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# @api_view(['GET', 'PUT', 'DELETE'])
# @permission_classes([IsAuthenticated])
# def subdivision_detail(request, pk):
#     try:
#         subdivision = Subdivision.objects.get(pk=pk)
#     except Subdivision.DoesNotExist:
#         return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

#     if request.method == 'GET':
#         serializer = SubdivisionSerializer(subdivision)
#         return Response(serializer.data)

#     elif request.method == 'PUT':
#         serializer = SubdivisionSerializer(subdivision, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     elif request.method == 'DELETE':
#         subdivision.delete()
#         return Response(status=status.HTTP_204_NO_CONTENT)
    
# @method_decorator(csrf_exempt, name='dispatch')
# class PinViewSet(ModelViewSet):
#     queryset = Pin.objects.all()
#     serializer_class = PinSerializer
#     permission_classes = [AllowAny]  # For testing
#     authentication_classes = [BasicAuthentication]  # or []

# @method_decorator(csrf_exempt, name='dispatch')
# class SubdivisionViewSet(ModelViewSet):
#     queryset = Subdivision.objects.all()
#     serializer_class = SubdivisionSerializer
#     permission_classes = [AllowAny]
#     authentication_classes = [BasicAuthentication]

# @csrf_exempt  # To allow POST requests without CSRF token (for simplicity)
# def verify_recaptcha(request):
#     if request.method == 'POST':
#         # Get the data from the frontend
#         data = json.loads(request.body)
#         recaptcha_token = data.get('recaptcha')

#         if not recaptcha_token:
#             return JsonResponse({'message': 'reCAPTCHA token missing'}, status=400)

#         # Google reCAPTCHA secret key (use your actual secret key here)
#         secret_key = settings.RECAPTCHA_SECRET_KEY

#         # Make a POST request to Google's reCAPTCHA verification API
#         payload = {
#             'secret': secret_key,
#             'response': recaptcha_token
#         }
#         response = requests.post("https://www.google.com/recaptcha/api/siteverify", data=payload)
#         result = response.json()

#         if not result.get('success'):
#             return JsonResponse({'message': 'reCAPTCHA verification failed'}, status=400)

#         # If the reCAPTCHA was successful, you can proceed with the login
#         # Example (replace with actual login logic)
#         username = data.get('username')
#         password = data.get('password')

#         # Your actual authentication logic goes here
#         if username == 'test' and password == 'password':
#             return JsonResponse({'access': 'fake-jwt-token'}, status=200)

#         return JsonResponse({'message': 'Invalid username or password'}, status=400)

#     return JsonResponse({'message': 'Invalid request method'}, status=405)

# class BookingViewSet(viewsets.ModelViewSet):
#     queryset = Booking.objects.all()
#     serializer_class = BookingSerializer
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         facility_id = self.request.query_params.get('facility_id')
#         qs = Booking.objects.filter(user=self.request.user)
#         if facility_id:
#             qs = qs.filter(facility_id=facility_id)
#         return qs

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)  # user comes from JWT

    # def get_queryset(self):
    #     facility_id = self.request.query_params.get('facility_id')
    #     qs = Booking.objects.filter(user=self.request.user)
    #     if facility_id:
    #         qs = qs.filter(facility_id=facility_id)
    #     return qs

    # def perform_create(self, serializer):
    #     serializer.save(user=self.request.user)
    
# @api_view(['PUT'])
# @permission_classes([IsAuthenticated])
# def update_user_profile(request):
#     user = request.user

#     # Ensure profile exists
#     profile, created = UserProfile.objects.get_or_create(user=user)

#     user.first_name = request.data.get("first_name", user.first_name)
#     user.last_name = request.data.get("last_name", user.last_name)
#     user.email = request.data.get("email", user.email)
#     user.username = request.data.get("username", user.username)
#     user.save()

#     if "profile_image" in request.FILES:
#         profile.profile_image = request.FILES["profile_image"]
#         profile.save()

#     return Response({
#         "username": user.username,
#         "first_name": user.first_name,
#         "last_name": user.last_name,
#         "email": user.email,
#         "profile_image": profile.profile_image.url if profile.profile_image else None
#     })    

# @api_view(['PUT'])
# def verify_user(request, user_id):
#     user = get_object_or_404(User, id=user_id)
#     profile = user.profile
#     profile.is_verified = True
#     profile.save()
#     return Response({"detail": "User verified successfully"})
    
# # Reject user
# @api_view(['PUT'])
# @permission_classes([IsAdminUser])
# def reject_user(request, user_id):
#     try:
#         profile = UserProfile.objects.get(user__id=user_id)
#         profile.is_verified = False
#         profile.document.delete(save=True)  # Optional: delete uploaded doc
#         return Response({'message': 'User rejected successfully'})
#     except UserProfile.DoesNotExist:
#         return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)   
    
# @api_view(['GET'])
# @permission_classes([IsAdminUser])
# def pending_verifications(request):
#     pending_profiles = UserProfile.objects.filter(is_verified=False, document__isnull=False)
#     data = []
#     for profile in pending_profiles:
#         data.append({
#             'id': profile.user.id,
#             'username': profile.user.username,
#             'email': profile.user.email,
#             'document': profile.document.url if profile.document else None,
#             'is_verified': profile.is_verified,  # <-- add this
#         })
#     return Response(data) 


