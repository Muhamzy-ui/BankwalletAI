from django.db import migrations
import cloudinary_storage.storage


class Migration(migrations.Migration):
    """Update TemplateImage and CustomGalleryImage to use per-field Cloudinary storage."""

    dependencies = [
        ('bot', '0003_templateimage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customgalleryimage',
            name='image',
            field=__import__('django.db.models', fromlist=['ImageField']).ImageField(
                upload_to='gallery/',
                storage=cloudinary_storage.storage.MediaCloudinaryStorage()
            ),
        ),
        migrations.AlterField(
            model_name='templateimage',
            name='image',
            field=__import__('django.db.models', fromlist=['ImageField']).ImageField(
                upload_to='templates/',
                storage=cloudinary_storage.storage.MediaCloudinaryStorage()
            ),
        ),
    ]
