from django.core.management.base import BaseCommand
from authentication.models import User


class Command(BaseCommand):
    help = 'Seed database with 4 dummy users'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting user seeding...'))
        
        # Clear existing users (optional)
        User.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('✓ Cleared existing users'))

        # User 1: Alice
        user1 = User.objects.create(
            username='alice',
            email='alice@example.com',
            password='alice_password123',
            first_name='Alice',
            last_name='Johnson',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created user: alice'))

        # User 2: Bob
        user2 = User.objects.create(
            username='bob',
            email='bob@example.com',
            password='bob_password123',
            first_name='Bob',
            last_name='Smith',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created user: bob'))

        # User 3: Charlie
        user3 = User.objects.create(
            username='charlie',
            email='charlie@example.com',
            password='charlie_password123',
            first_name='Charlie',
            last_name='Brown',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created user: charlie'))

        # User 4: Diana
        user4 = User.objects.create(
            username='diana',
            email='diana@example.com',
            password='diana_password123',
            first_name='Diana',
            last_name='Prince',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created user: diana'))

        self.stdout.write(self.style.SUCCESS('\n✓ User seeding completed!\n'))
        self.stdout.write(self.style.WARNING('Users created:'))
        self.stdout.write('  1. alice (alice@example.com)')
        self.stdout.write('  2. bob (bob@example.com)')
        self.stdout.write('  3. charlie (charlie@example.com)')
        self.stdout.write('  4. diana (diana@example.com)')
