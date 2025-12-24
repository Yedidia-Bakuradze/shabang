from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from authentication.models import User


class Command(BaseCommand):
    help = 'Seed database with test users including admin'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting user seeding...'))
        
        # Clear existing users (optional)
        User.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('✓ Cleared existing users'))

        # Admin user
        admin = User.objects.create(
            username='admin',
            email='admin@example.com',
            password=make_password('admin123'),
            first_name='Admin',
            last_name='User',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created admin user: admin / admin123'))

        # User 1: Alice
        user1 = User.objects.create(
            username='alice',
            email='alice@example.com',
            password=make_password('alice123'),
            first_name='Alice',
            last_name='Johnson',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created user: alice / alice123'))

        # User 2: Bob
        user2 = User.objects.create(
            username='bob',
            email='bob@example.com',
            password=make_password('bob123'),
            first_name='Bob',
            last_name='Smith',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created user: bob / bob123'))

        # User 3: Charlie
        user3 = User.objects.create(
            username='charlie',
            email='charlie@example.com',
            password=make_password('charlie123'),
            first_name='Charlie',
            last_name='Brown',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('✓ Created user: charlie / charlie123'))

        self.stdout.write(self.style.SUCCESS('\n✓ User seeding completed!\n'))
        self.stdout.write(self.style.WARNING('Users created with hashed passwords:'))
        self.stdout.write('  • admin / admin123 (superuser)')
        self.stdout.write('  • alice / alice123')
        self.stdout.write('  • bob / bob123')
        self.stdout.write('  • charlie / charlie123')
