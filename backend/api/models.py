from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers
from simple_history.models import HistoricalRecords
import random
from django.core.mail import send_mail

def user_profile_path(instance, filename):
    return f'profile_images/user_{instance.user.id}/{filename}'

def billing_path(instance, filename):
    return f'billing/user_{instance.user.id}/{filename}'

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    profile_image = models.ImageField(upload_to=user_profile_path, blank=True, null=True)
    contact_number = models.CharField(max_length=13, blank=True, null=True)  # +639XXXXXXXXX
    is_verified = models.BooleanField(default=False)  # ✅ New field
    document = models.FileField(upload_to='documents/', blank=True, null=True)
    billing = models.FileField(upload_to='billing/', blank=True, null=True)  # ✅ Uploaded document
    history = HistoricalRecords()

    def __str__(self):
        return self.user.username


# --- signals ---
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class Post(models.Model):
    title = models.CharField(max_length=100)
    body = models.TextField()
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.title


class Message(models.Model):
    text = models.TextField()
    sender = models.CharField(max_length=10)
    timestamp = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.sender}: {self.text[:30]}"


class Subdivision(models.Model):
    lot_number = models.CharField(max_length=50, unique=True)
    is_occupied = models.BooleanField(default=False)
    owner_name = models.CharField(max_length=100, blank=True, null=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.lot_number} - {'Occupied' if self.is_occupied else 'Not Occupied'}"


class Pin(models.Model):
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    occupant = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)  # Available | Occupied | Reserved
    price = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    square_meter = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    image = models.ImageField(upload_to='pin_images/', blank=True, null=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.name

    def get_average_rating(self):
        """Calculate average rating for this pin"""
        reviews = self.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return 0.0

    def get_review_count(self):
        """Get total number of reviews"""
        return self.reviews.count()


class Review(models.Model):
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    pin = models.ForeignKey(Pin, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        unique_together = ['pin', 'user']  # One review per user per pin
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.pin.name} ({self.rating} stars)"

# --- Facility ---
class Facility(models.Model):
    FACILITY_CHOICES = [
        ("Court", "Basketball Court"),
        ("Pool", "Swimming Pool"),
    ]
    name = models.CharField(max_length=100, choices=FACILITY_CHOICES)
    history = HistoricalRecords()

    def __str__(self):
        return self.get_name_display()

# --- Booking ---
class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name="bookings")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user.username} booked {self.facility.get_name_display()} on {self.date} ({self.status})"    

# --- Available Slot (Admin sets available booking times) ---
class AvailableSlot(models.Model):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name="available_slots")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    class Meta:
        unique_together = ['facility', 'date', 'start_time', 'end_time']
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.facility.get_name_display()} - {self.date} ({self.start_time} to {self.end_time})"
    
    
class News(models.Model):
    title = models.CharField(max_length=150)
    content = models.TextField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.title


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("critical", "Critical"),
    ]
    title = models.CharField(max_length=150)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="info")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"[{self.severity}] {self.title}"


class ContactInfo(models.Model):
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.address or self.email or "Contact Info"


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.subject} from {self.name}"
 
class ResidentPin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="resident_pin")
    pin = models.CharField(max_length=6, blank=True, null=True)
    history = HistoricalRecords()

    def generate_pin(self):
        self.pin = f"{random.randint(100000, 999999)}"
        self.save()
        return self.pin

    def __str__(self):
        return f"{self.user.username} - {self.pin}"   
    
class Visitor(models.Model):
    name = models.CharField(max_length=255)
    gmail = models.EmailField(blank=True, null=True)  # Gmail field
    contact_number = models.CharField(max_length=20, blank=True, null=True)  # Optional contact number
    pin_entered = models.CharField(max_length=6, blank=True, null=True)
    history = HistoricalRecords()  # Entered resident PIN
    resident = models.ForeignKey(
        "ResidentPin",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=10,
        choices=[
            ("pending", "Pending"),
            ("approved", "Approved"),
            ("declined", "Declined")
        ],
        default="pending"
    )
    time_in = models.DateTimeField(null=True, blank=True)
    time_out = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.gmail or 'No Email'})"   


class House(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="houses")
    title = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='house_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Billing(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='billing_records')
    file = models.FileField(upload_to='billing/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_profile.user.username} - {self.file.name}"
    
class BillingRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billing_records')
    file = models.FileField(upload_to=billing_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user.username} - {self.file.name.split('/')[-1]}"    
# Store the PIN for each resident/admin
# class ResidentPin(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="resident_pin")
#     pin = models.CharField(max_length=6, blank=True, null=True)
#     history = HistoricalRecords()

#     def generate_pin(self):
#         # Generate a 6-digit numeric PIN
#         self.pin = f"{random.randint(100000, 999999)}"
#         self.save()
#         return self.pin

#     def __str__(self):
#         return f"{self.user.username} - {self.pin}"


# Track visitor check-ins
# class Visitor(models.Model):
#     name = models.CharField(max_length=255)
#     gmail = models.EmailField(blank=True, null=True)  # <-- use gmail
#     pin_entered = models.CharField(max_length=6, blank=True, null=True)
#     resident = models.ForeignKey("ResidentPin", on_delete=models.SET_NULL, null=True, blank=True)
#     reason = models.TextField(blank=True, null=True)    
#     status = models.CharField(
#         max_length=10,
#         choices=[("pending","Pending"),("approved","Approved"),("declined","Declined")],
#         default="pending"
#     )
#     time_in = models.DateTimeField(null=True, blank=True)
#     time_out = models.DateTimeField(null=True, blank=True)

#     def __str__(self):
#         return f"{self.name} ({self.gmail})"

# class Facility(models.Model):
#     FACILITY_CHOICES = [
#         ("Court", "Basketball Court"),
#         ("Pool", "Swimming Pool"),
#     ]
#     name = models.CharField(max_length=100, choices=FACILITY_CHOICES)

#     def __str__(self):
#         return self.get_name_display()


# class Booking(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
#     facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name="bookings")
#     date = models.DateField()
#     start_time = models.TimeField()
#     end_time = models.TimeField()
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.user.username} booked {self.facility.get_name_display()} on {self.date}"


# # from django.db import models

# # class Post(models.Model):
# #     title = models.CharField(max_length=100)
# #     body = models.TextField()
# #     lat = models.FloatField(null=True, blank=True)
# #     lng = models.FloatField(null=True, blank=True)

# # class Message(models.Model):
# #     text = models.TextField()
# #     sender = models.CharField(max_length=10)
# #     timestamp = models.DateTimeField(auto_now_add=True)

# #     def __str__(self):
# #         return f"{self.sender}: {self.text[:30]}"    

# # models.py
# from django.db import models
# from django.db import models
# from django.contrib.auth.models import User

# def user_profile_path(instance, filename):
#     return f'profile_images/user_{instance.user.id}/{filename}'

# class UserProfile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
#     profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)

#     def __str__(self):
#         return self.user.username


# # --- signals ---
# from django.db.models.signals import post_save
# from django.dispatch import receiver

# @receiver(post_save, sender=User)
# def create_user_profile(sender, instance, created, **kwargs):
#     if created:
#         UserProfile.objects.create(user=instance)

# class Post(models.Model):
#     title = models.CharField(max_length=100)
#     body = models.TextField()
#     lat = models.FloatField(null=True, blank=True)
#     lng = models.FloatField(null=True, blank=True)

# class Message(models.Model):
#     text = models.TextField()
#     sender = models.CharField(max_length=10)
#     timestamp = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.sender}: {self.text[:30]}"

# class Subdivision(models.Model):
#     lot_number = models.CharField(max_length=50, unique=True)
#     is_occupied = models.BooleanField(default=False)
#     owner_name = models.CharField(max_length=100, blank=True, null=True)

#     def __str__(self):
#         return f"{self.lot_number} - {'Occupied' if self.is_occupied else 'Not Occupied'}"
    
# class Pin(models.Model):
#     name = models.CharField(max_length=255)
#     latitude = models.FloatField()
#     longitude = models.FloatField()

#     def __str__(self):
#         return self.name