import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = os.getenv('MONGODB_DB', 'pneumax_db')

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.users = None
        self.scans = None
        self.connect()
    
    def connect(self):
        try:
            self.client = MongoClient(MONGODB_URI)
            self.db = self.client[MONGODB_DB]
            self.users = self.db.users
            self.scans = self.db.scans
            print(f"Connected to MongoDB at {MONGODB_URI}")
            return True
        except Exception as e:
            print(f"MongoDB connection error: {e}")
            return False
    
    def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")
    
    def get_user_by_email(self, email):
        try:
            return self.users.find_one({'email': email})
        except Exception as e:
            print(f"Error finding user: {e}")
            return None
    
    def create_user(self, user_data):
        try:
            result = self.users.insert_one(user_data)
            return result.inserted_id
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    def update_user(self, email, update_data):
        try:
            return self.users.update_one(
                {'email': email},
                {'$set': update_data}
            )
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
    
    def save_scan(self, scan_data):
        try:
            result = self.scans.insert_one(scan_data)
            return result.inserted_id
        except Exception as e:
            print(f"Error saving scan: {e}")
            return None
    
    def get_user_scans(self, email, limit=10):
        try:
            return list(self.scans.find(
                {'user_email': email}
            ).sort('date', -1).limit(limit))
        except Exception as e:
            print(f"Error getting user scans: {e}")
            return []
    
    def get_health_status(self):
        try:
            # Check if we can connect to MongoDB
            self.client.admin.command('ping')
            return {
                'status': 'healthy',
                'mongodb_connected': True,
                'database': MONGODB_DB
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'mongodb_connected': False,
                'error': str(e)
            }

# Global MongoDB instance
db = MongoDB()
