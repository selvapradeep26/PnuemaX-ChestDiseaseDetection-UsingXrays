import os
from pymongo import MongoClient
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError
from dotenv import load_dotenv
from bson import ObjectId

# Load environment variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

# MongoDB configuration
MONGODB_URI = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI') or 'mongodb://localhost:27017'
MONGODB_DB = os.getenv('MONGODB_DB', 'pneumax_db')

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.users = None
        self.scans = None
        self.connected = False
        self.last_error = None
        # In-memory fallback storage
        self._in_memory_users = {}
        self._in_memory_scans = []
        self.connect()
    
    def connect(self):
        try:
            self.last_error = None
            self.client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                retryWrites=False
            )
            # Force a connection check
            self.client.admin.command('ping')
            self.db = self.client[MONGODB_DB]
            self.users = self.db.users
            self.scans = self.db.scans
            self._ensure_indexes()
            self.connected = True
            print(f"Connected to MongoDB at {MONGODB_URI}")
            return True
        except Exception as e:
            self.last_error = str(e)
            print(f"MongoDB connection error: {e}")
            self.client = None
            self.db = None
            self.users = None
            self.scans = None
            self.connected = False
            print("Using in-memory storage for testing")
            # Create test user for development
            self._create_test_user()
            return False

    def _ensure_indexes(self):
        """Create indexes required for per-user access and uniqueness."""
        if self.users is not None:
            self.users.create_index([('email', ASCENDING)], unique=True)
        if self.scans is not None:
            self.scans.create_index([('user_id', ASCENDING), ('date', DESCENDING)])
            self.scans.create_index([('user_email', ASCENDING), ('date', DESCENDING)])

    def _serialize_document(self, document):
        """Convert MongoDB-only types into JSON-safe values."""
        if isinstance(document, list):
            return [self._serialize_document(item) for item in document]

        if isinstance(document, dict):
            serialized = {}
            for key, value in document.items():
                if isinstance(value, ObjectId):
                    serialized[key] = str(value)
                elif hasattr(value, 'isoformat'):
                    serialized[key] = value.isoformat()
                elif isinstance(value, (dict, list)):
                    serialized[key] = self._serialize_document(value)
                else:
                    serialized[key] = value
            return serialized

        return document
    
    def _create_test_user(self):
        """Create a test user for development when MongoDB is unavailable"""
        import bcrypt
        import datetime
        
        test_user = {
            'email': 'test@example.com',
            'password': bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8'),
            'firstName': 'Test',
            'lastName': 'User',
            'createdAt': datetime.datetime.utcnow(),
            'isActive': True
        }
        
        import uuid
        user_id = str(uuid.uuid4())
        self._in_memory_users[user_id] = test_user
        print(f"Created test user: test@example.com / password123")
    
    def _get_in_memory_user_by_email(self, email):
        """Get user from in-memory storage"""
        for user_id, user in self._in_memory_users.items():
            if user.get('email') == email:
                # Add _id field for compatibility
                user['_id'] = user_id
                return user
        return None
    
    def _create_in_memory_user(self, user_data):
        """Create user in in-memory storage"""
        import uuid
        user_id = str(uuid.uuid4())
        self._in_memory_users[user_id] = user_data
        return user_id
    
    def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")
    
    def get_user_by_email(self, email):
        try:
            if self.connected and self.users is not None:
                user = self.users.find_one({'email': email})
                return self._serialize_document(user) if user else None
            else:
                return self._get_in_memory_user_by_email(email)
        except Exception as e:
            print(f"Error finding user: {e}")
            return self._get_in_memory_user_by_email(email)
    
    def create_user(self, user_data):
        try:
            self.last_error = None
            if self.connected and self.users is not None:
                result = self.users.insert_one(user_data)
                return result.inserted_id
            self.last_error = 'MongoDB is not connected.'
            return None
        except DuplicateKeyError:
            self.last_error = 'User already exists'
            print("Error creating user: duplicate email")
            return None
        except PyMongoError as e:
            self.last_error = str(e)
            print(f"Error creating user: {e}")
            return None
        except Exception as e:
            self.last_error = str(e)
            print(f"Error creating user: {e}")
            return None
    
    def update_user(self, email, update_data):
        try:
            if self.connected and self.users is not None:
                return self.users.update_one(
                    {'email': email},
                    {'$set': update_data}
                )
            return False
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
    
    def save_scan(self, scan_data):
        try:
            if self.connected and self.scans is not None:
                result = self.scans.insert_one(scan_data)
                return result.inserted_id
            return None
        except Exception as e:
            print(f"Error saving scan: {e}")
            return None
    
    def get_user_scans(self, email=None, user_id=None, limit=10):
        try:
            if self.connected and self.scans is not None:
                query = {'user_id': user_id} if user_id else {'user_email': email}
                scans = list(self.scans.find(
                    query
                ).sort('date', -1).limit(limit))
                return self._serialize_document(scans)

            if user_id:
                scans = [scan for scan in self._in_memory_scans if scan.get('user_id') == user_id]
            else:
                scans = [scan for scan in self._in_memory_scans if scan.get('user_email') == email]
            scans.sort(key=lambda scan: scan.get('date'), reverse=True)
            return scans[:limit]
        except Exception as e:
            print(f"Error getting user scans: {e}")
            return []
    
    def get_health_status(self):
        if self.connected and self.client:
            try:
                # Check if we can connect to MongoDB
                self.client.admin.command('ping')
                return {
                    'status': 'healthy',
                    'mongodb_connected': True,
                    'database': MONGODB_DB,
                    'mode': 'mongodb'
                }
            except Exception as e:
                return {
                    'status': 'degraded',
                    'mongodb_connected': False,
                    'mode': 'in-memory',
                    'error': str(e)
                }

        return {
            'status': 'degraded',
            'mongodb_connected': False,
            'database': MONGODB_DB,
            'mode': 'in-memory',
            'error': 'MongoDB is unavailable; writes are disabled until the database reconnects.'
        }

# Global MongoDB instance
db = MongoDB()
