from django.db import migrations, models
import django.db.models.deletion
import cloudinary_storage.storage


class Migration(migrations.Migration):

    dependencies = [
        ('bot', '0002_customgalleryimage'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='TemplateImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='templates/')),
                ('bank_name', models.CharField(blank=True, max_length=100)),
                ('template_type', models.CharField(default='changethename', help_text='e.g. changethename or sendlikethis', max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='templates', to='auth.user')),
            ],
        ),
    ]
