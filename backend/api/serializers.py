from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Billing, Post, Message, Subdivision, Pin, UserProfile, Booking, Facility, AvailableSlot, News, Alert, ContactInfo, ContactMessage, Review, House
from simple_history.models import HistoricalRecords


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'


class SubdivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subdivision
        fields = ['id', 'lot_number', 'is_occupied', 'owner_name']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_profile_image = serializers.SerializerMethodField()
    pin_name = serializers.CharField(source='pin.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'pin', 'pin_name', 'user', 'user_name', 'user_profile_image',
            'rating', 'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_user_profile_image(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile.profile_image.url)
            return obj.user.profile.profile_image.url
        return None


class PinSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Pin
        fields = [
            'id',
            'name',
            'latitude',
            'longitude',
            'occupant',
            'status',
            'price',
            'description',
            'square_meter',
            'image',
            'average_rating',
            'review_count',
        ]

    def get_average_rating(self, obj):
        return obj.get_average_rating()

    def get_review_count(self, obj):
        return obj.get_review_count()

class UserProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    document = serializers.SerializerMethodField()
    billing_records = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['profile_image', 'contact_number', 'is_verified', 'document', 'billing_records']

    def get_profile_image(self, obj):
        request = self.context.get('request')
        if obj.profile_image:
            return request.build_absolute_uri(obj.profile_image.url) if request else obj.profile_image.url
        return None

    def get_document(self, obj):
        request = self.context.get('request')
        if obj.document:
            return request.build_absolute_uri(obj.document.url) if request else obj.document.url
        return None

    def get_billing_records(self, obj):
        request = self.context.get('request')
        return [request.build_absolute_uri(b.file.url) if request else b.file.url for b in obj.billing_records.all()]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'profile']

class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ['id', 'name']

class BookingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    facility_name = serializers.CharField(source='facility.get_name_display', read_only=True)
    facility_id = serializers.PrimaryKeyRelatedField(
        queryset=Booking.objects.model.facility.field.related_model.objects.all(),
        source='facility',
        write_only=True
    )

    class Meta:
        model = Booking
        fields = [
            'id', 'user_name', 'facility_name', 'facility_id',
            'date', 'start_time', 'end_time', 'status'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class AvailableSlotSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='facility.get_name_display', read_only=True)
    facility_id = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.all(),
        source='facility',
        write_only=True
    )

    class Meta:
        model = AvailableSlot
        fields = [
            'id', 'facility_id', 'facility_name',
            'date', 'start_time', 'end_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = ['id', 'title', 'content', 'is_published', 'created_at']


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'title', 'message', 'severity', 'is_active', 'created_at']


class ContactInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInfo
        fields = ['id', 'address', 'phone', 'email']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'is_resolved', 'created_at']

 



class HistoricalRecordSerializer(serializers.ModelSerializer):
    history_user = serializers.CharField(source='history_user.username', default='System', read_only=True)
    model_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile.history.model
        fields = ['id', 'history_date', 'history_type', 'history_user', 'model_name']

    def get_model_name(self, obj):
        return obj.instance.__class__.__name__
    

class UserProfileAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['contact_number', 'is_verified', 'document', 'profile_image']

class UserAdminSerializer(serializers.ModelSerializer):
    profile = UserProfileAdminSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

from .models import ResidentPin, Visitor

class ResidentPinSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)  # add username

    class Meta:
        model = ResidentPin
        fields = ["id", "pin", "username"]  # include username

class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = [
            'id', 'name', 'gmail', 'contact_number', 'reason', 'pin_entered', 'resident', 'status', 'time_in', 'time_out'
        ]

class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name']

class HouseSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    image = serializers.ImageField(use_url=True)  # ✅ include user details

    class Meta:
        model = House
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

# serializers.py
class BillingUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['billing']


class BillingSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = Billing
        fields = ['id', 'file', 'uploaded_at']

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        elif obj.file:
            return obj.file.url
        return None
        
                

     
# class VisitorSerializer(serializers.ModelSerializer):
#     resident = ResidentPinSerializer(read_only=True)  # nested serializer

#     class Meta:
#         model = Visitor
#         fields = ["id", "name", "pin_entered", "resident", "time_in", "time_out", "status"]
#         read_only_fields = ["time_in", "time_out", "resident", "status"]

# class FacilitySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Facility
#         fields = ['id', 'name']

# class BookingSerializer(serializers.ModelSerializer):
#     facility_name = serializers.CharField(source='facility.name', read_only=True)
#     facility_id = serializers.PrimaryKeyRelatedField(
#         queryset=Facility.objects.all(),
#         source='facility',
#         write_only=True
#     )

#     class Meta:
#         model = Booking
#         fields = ['id', 'user', 'facility', 'facility_id', 'facility_name', 'date', 'start_time', 'end_time', 'created_at']
#         read_only_fields = ['user', 'facility', 'facility_name', 'created_at']


