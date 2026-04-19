import os
import glob
from django.core.management.base import BaseCommand
from django.core.files import File
from django.contrib.auth.models import User
from bot.models import TemplateImage
from django.conf import settings

class Command(BaseCommand):
    help = 'Migrates local templates from media/templates/ to Cloudinary database storage'

    def handle(self, *args, **options):
        user = User.objects.first()
        if not user:
            self.stdout.write(self.style.ERROR('No user found to own the templates.'))
            return

        template_dir = os.path.join(settings.BASE_DIR, 'media', 'templates')
        patterns = ['*.jpeg', '*.jpg', '*.png']
        files = []
        for pat in patterns:
            files.extend(glob.glob(os.path.join(template_dir, pat)))
        
        self.stdout.write(f'Found {len(files)} local templates. Starting migration...')

        for fpath in files:
            fname = os.path.basename(fpath)
            
            # Check if already exists in DB by filename
            if TemplateImage.objects.filter(image__icontains=fname).exists():
                self.stdout.write(f'Skipping {fname} - already in DB.')
                continue

            # Determine type
            t_type = 'sendlikethis' if 'sendlikethis' in fname.lower() else 'changethename'
            
            # Extract bank name if possible
            bank_name = fname.split('_')[0].capitalize() if '_' in fname else ''

            with open(fpath, 'rb') as f:
                new_template = TemplateImage(
                    owner=user,
                    bank_name=bank_name,
                    template_type=t_type,
                    is_active=True
                )
                new_template.image.save(fname, File(f), save=True)
                self.stdout.write(self.style.SUCCESS(f'Migrated {fname} to Cloudinary!'))

        self.stdout.write(self.style.SUCCESS('Migration complete.'))
