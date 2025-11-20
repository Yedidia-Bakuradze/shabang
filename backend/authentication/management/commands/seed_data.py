from django.core.management.base import BaseCommand
from authentication.models import User
from project.models import Project


class Command(BaseCommand):
    help = 'Seed database with dummy data (4 users with their projects)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting database seeding...'))
        
        # Clear existing data (optional)
        User.objects.all().delete()
        Project.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('✓ Cleared existing data'))

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

        # Projects for Alice
        Project.objects.create(
            owner=user1,
            name='E-Commerce Database',
            description='Complete schema design for an online store with users, products, and orders',
            entities={
                'tables': [
                    {'name': 'users', 'columns': ['id', 'email', 'username', 'password', 'created_at']},
                    {'name': 'products', 'columns': ['id', 'name', 'price', 'category', 'stock']},
                    {'name': 'orders', 'columns': ['id', 'user_id', 'total', 'status', 'created_at']},
                    {'name': 'order_items', 'columns': ['id', 'order_id', 'product_id', 'quantity', 'price']}
                ],
                'relationships': [
                    {'from': 'orders', 'to': 'users', 'type': 'many_to_one'},
                    {'from': 'order_items', 'to': 'orders', 'type': 'many_to_one'},
                    {'from': 'order_items', 'to': 'products', 'type': 'many_to_one'}
                ]
            }
        )

        Project.objects.create(
            owner=user1,
            name='Blog Platform',
            description='Database design for a blogging platform with posts, comments, and categories',
            entities={
                'tables': [
                    {'name': 'users', 'columns': ['id', 'username', 'email', 'bio', 'created_at']},
                    {'name': 'posts', 'columns': ['id', 'author_id', 'title', 'content', 'published_at']},
                    {'name': 'comments', 'columns': ['id', 'post_id', 'user_id', 'text', 'created_at']},
                    {'name': 'categories', 'columns': ['id', 'name', 'slug']}
                ]
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Created 2 projects for alice'))

        # Projects for Bob
        Project.objects.create(
            owner=user2,
            name='Social Network',
            description='Schema for a social media platform with users, posts, and followers',
            entities={
                'tables': [
                    {'name': 'users', 'columns': ['id', 'username', 'email', 'bio', 'profile_pic']},
                    {'name': 'posts', 'columns': ['id', 'user_id', 'content', 'likes_count', 'created_at']},
                    {'name': 'comments', 'columns': ['id', 'post_id', 'user_id', 'text']},
                    {'name': 'followers', 'columns': ['follower_id', 'following_id', 'created_at']},
                    {'name': 'likes', 'columns': ['user_id', 'post_id', 'created_at']}
                ]
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Created 1 project for bob'))

        # Projects for Charlie
        Project.objects.create(
            owner=user3,
            name='Hospital Management System',
            description='Database for hospital operations including patients, doctors, and appointments',
            entities={
                'tables': [
                    {'name': 'patients', 'columns': ['id', 'name', 'email', 'phone', 'dob', 'address']},
                    {'name': 'doctors', 'columns': ['id', 'name', 'specialization', 'license_number', 'phone']},
                    {'name': 'appointments', 'columns': ['id', 'patient_id', 'doctor_id', 'date', 'time', 'status']},
                    {'name': 'medical_records', 'columns': ['id', 'patient_id', 'diagnosis', 'treatment', 'date']}
                ]
            }
        )

        Project.objects.create(
            owner=user3,
            name='University Management',
            description='System for managing students, courses, and grades',
            entities={
                'tables': [
                    {'name': 'students', 'columns': ['id', 'name', 'email', 'enrollment_date', 'gpa']},
                    {'name': 'courses', 'columns': ['id', 'name', 'code', 'credits', 'instructor_id']},
                    {'name': 'instructors', 'columns': ['id', 'name', 'email', 'department']},
                    {'name': 'enrollments', 'columns': ['student_id', 'course_id', 'grade', 'semester']}
                ]
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Created 2 projects for charlie'))

        # Projects for Diana
        Project.objects.create(
            owner=user4,
            name='Inventory Management',
            description='Warehouse and inventory tracking system',
            entities={
                'tables': [
                    {'name': 'warehouse', 'columns': ['id', 'name', 'location', 'capacity']},
                    {'name': 'items', 'columns': ['id', 'name', 'sku', 'category', 'unit_price']},
                    {'name': 'stock', 'columns': ['item_id', 'warehouse_id', 'quantity', 'last_updated']},
                    {'name': 'transactions', 'columns': ['id', 'item_id', 'warehouse_id', 'type', 'quantity', 'date']}
                ]
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Created 1 project for diana'))

        self.stdout.write(self.style.SUCCESS('\n✓ Database seeded successfully!\n'))
        self.stdout.write(self.style.WARNING('Users created:'))
        self.stdout.write('  1. alice (alice@example.com) - 2 projects')
        self.stdout.write('  2. bob (bob@example.com) - 1 project')
        self.stdout.write('  3. charlie (charlie@example.com) - 2 projects')
        self.stdout.write('  4. diana (diana@example.com) - 1 project')
        self.stdout.write('\nYou can now login using the authentication service with these credentials.')
