from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from api.models import Pin, Facility, Booking


# Auto-create default facilities when a Pin is added
@receiver(post_save, sender=Pin)
def create_default_facilities(sender, instance, created, **kwargs):
    if created:
        # Only create facilities if they don't already exist
        if not Facility.objects.filter(name="Court").exists():
            Facility.objects.create(name="Court")
        if not Facility.objects.filter(name="Pool").exists():
            Facility.objects.create(name="Pool")

# Log booking creation
@receiver(post_save, sender=Booking)
def notify_booking_created(sender, instance, created, **kwargs):
    if created:
        print(f"📅 New booking: {instance.user} booked {instance.facility}")

# Log booking deletion
@receiver(post_delete, sender=Booking)
def notify_booking_deleted(sender, instance, **kwargs):
    print(f"🗑️ Booking deleted: {instance.user} canceled {instance.facility}")
