from rest_framework import serializers
from .models import ActivityLog, ChannelStats

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'