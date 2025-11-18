# admin.py
from django.contrib import admin
from django.utils import timezone
from .models import Post, Message, Subdivision, Pin, Facility, Booking, News, Alert, ContactInfo, ContactMessage, ResidentPin, Visitor, House
from .models import UserProfile
from django.utils.html import format_html
from .models import Billing, BillingRecord


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'lat', 'lng')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'text', 'timestamp')

@admin.register(Subdivision)
class SubdivisionAdmin(admin.ModelAdmin):
    list_display = ('lot_number', 'is_occupied', 'owner_name')
    list_filter = ('is_occupied',)
    search_fields = ('lot_number', 'owner_name')

@admin.register(Pin)
class PinAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude')

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'facility', 'date', 'start_time', 'end_time', 'created_at') 

@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_published', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('title',)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'severity', 'is_active', 'created_at')
    list_filter = ('severity', 'is_active')
    search_fields = ('title',)


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ('address', 'phone', 'email')


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'name', 'email', 'is_resolved', 'created_at')
    list_filter = ('is_resolved',)
    search_fields = ('subject', 'name', 'email')

# --- ResidentPin & Visitor Admin ---
class VisitorInline(admin.TabularInline):
    model = Visitor
    extra = 0
    readonly_fields = ('time_in', 'time_out')
    fields = ('name', 'pin_entered', 'status', 'time_in', 'time_out')

@admin.register(ResidentPin)
class ResidentPinAdmin(admin.ModelAdmin):
    list_display = ('user', 'pin')
    inlines = [VisitorInline]

@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ('name', 'gmail', 'pin_entered', 'resident', 'status', 'time_in', 'time_out')
    list_filter = ('status',)
    search_fields = ('name', 'gmail', 'pin_entered', 'resident__user__username')
    actions = ['approve_visitor', 'decline_visitor']

    def approve_visitor(self, request, queryset):
        queryset.update(status='approved', time_in=timezone.now())
        self.message_user(request, "✅ Selected visitors have been approved.")
    approve_visitor.short_description = "Approve selected visitors"

    def decline_visitor(self, request, queryset):
        queryset.update(status='declined', time_out=timezone.now())
        self.message_user(request, "❌ Selected visitors have been declined.")
    decline_visitor.short_description = "Decline selected visitors"

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'price', 'location', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('title', 'location', 'description', 'user__username')
    readonly_fields = ('created_at',)
    # Show image preview
    def image_tag(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" width="100" />'
        return "-"
    image_tag.allow_tags = True
    image_tag.short_description = 'Image'
    fields = ('user', 'title', 'price', 'location', 'description', 'image', 'image_tag', 'created_at')    

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "contact_number",
        "is_verified",
        "document_link",
        "billing_link",
        "profile_image_preview",
    )

    search_fields = ("user__username", "contact_number")
    list_filter = ("is_verified",)

    # Show document download link
    def document_link(self, obj):
        if obj.document:
            return format_html(
                "<a href='{}' target='_blank'>📄 Download</a>",
                obj.document.url
            )
        return "No document"

    document_link.short_description = "Document"

    # Show billing download link
    def billing_link(self, obj):
        if obj.billing:
            return format_html(
                "<a href='{}' target='_blank'>💰 Billing</a>",
                obj.billing.url
            )
        return "No billing"

    billing_link.short_description = "Billing"

    # Show profile image thumbnail
    def profile_image_preview(self, obj):
        if obj.profile_image:
            return format_html(
                "<img src='{}' width='50' height='50' style='border-radius: 5px;'/>",
                obj.profile_image.url
            )
        return "No Image"

    profile_image_preview.short_description = "Profile Image"

@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = ("user_profile", "uploaded_at", "file_link")
    search_fields = ("user_profile__user__username",)
    list_filter = ("uploaded_at",)

    # Show clickable link to the file
    def file_link(self, obj):
        if obj.file:
            return format_html(
                "<a href='{}' target='_blank'>📄 {}</a>",
                obj.file.url,
                obj.file.name.split("/")[-1]
            )
        return "No file"

    file_link.short_description = "Billing File"    