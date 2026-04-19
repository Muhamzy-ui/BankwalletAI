from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TelegramChannel, ScheduleWindow, CaptionTemplate, Post, BotSettings, CustomGalleryImage, TemplateImage


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        BotSettings.objects.create(owner=user)
        return user


class ScheduleWindowSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()
    class Meta:
        model = ScheduleWindow
        fields = '__all__'

    def get_day_name(self, obj):
        days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        return days[obj.day_of_week]


class TelegramChannelSerializer(serializers.ModelSerializer):
    schedule_windows = ScheduleWindowSerializer(many=True, read_only=True)
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = TelegramChannel
        fields = '__all__'
        read_only_fields = ['owner']

    def get_post_count(self, obj):
        return obj.posts.count()


class CaptionTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaptionTemplate
        fields = '__all__'
        read_only_fields = ('owner', 'use_count', 'created_at', 'is_ai_generated')


class CustomGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomGalleryImage
        fields = '__all__'
        read_only_fields = ('owner', 'uploaded_at')


class TemplateImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateImage
        fields = '__all__'
        read_only_fields = ('owner', 'uploaded_at')


class PostSerializer(serializers.ModelSerializer):
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ['owner', 'sent_at', 'telegram_message_id']


class BotSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BotSettings
        fields = '__all__'
        read_only_fields = ['owner']