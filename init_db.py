from app import supabase
from werkzeug.security import generate_password_hash

def init_db():
    try:
        # Create admin user if it doesn't exist
        response = supabase.from_('users').select("*").eq('username', 'admin').execute()
        if not response.data:
            admin_data = {
                'username': 'admin',
                'email': 'admin@medicalchatbot.com',
                'password_hash': generate_password_hash('admin'),
                'created_at': 'now()'
            }
            supabase.from_('users').insert(admin_data).execute()
            print("Admin user created successfully!")
        else:
            print("Admin user already exists!")

    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise e

if __name__ == '__main__':
    init_db() 