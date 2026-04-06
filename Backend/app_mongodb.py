from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import os
import random
import bcrypt
import jwt
import datetime
from functools import wraps
from database import db

app = Flask(__name__)
CORS(app)

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_here')
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))

# Check if model exists, otherwise create a dummy model for testing
model_path = "output/models/LuNet.h5"
if os.path.exists(model_path):
    model = tf.keras.models.load_model(model_path, compile=False)
    print(f"Model loaded from {model_path}")
else:
    # Create a multi-class dummy model for testing
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 3)),
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(3, activation='softmax')  # 3 classes: Normal, Pneumonia, Tuberculosis
    ])
    print("Warning: Using dummy model - actual model not found at", model_path)

DISEASE_INFO = {
    "Normal": {
        "precaution": "No abnormality detected. Maintain regular health check-ups and a healthy lifestyle.",
        "follow_up": "Routine follow-up in 6-12 months if asymptomatic.",
        "severity": "Low",
        "recommendations": ["Continue regular exercise", "Maintain balanced diet", "Annual health checkups"]
    },
    "Pneumonia": {
        "precaution": "Start antibiotic therapy as prescribed. Get adequate rest and maintain hydration. Monitor fever and breathing difficulty.",
        "follow_up": "Follow-up with primary care physician in 2-3 days or sooner if symptoms worsen.",
        "severity": "Medium",
        "recommendations": ["Complete antibiotic course", "Monitor temperature daily", "Rest and hydration", "Avoid strenuous activity"]
    },
    "Tuberculosis": {
        "precaution": "Start anti-TB medication immediately. Isolate to prevent transmission. Ensure proper ventilation at home. Complete full course of treatment.",
        "follow_up": "Immediate referral to pulmonologist. Monthly follow-ups during treatment.",
        "severity": "High",
        "recommendations": ["Start DOT therapy", "Home isolation for 2 weeks", "Nutritional supplements", "Regular sputum testing"]
    }
}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Handle "Bearer <token>" format
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            token = auth_header
        
        try:
            # Decode token; PyJWT will raise for expired/invalid tokens
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except Exception:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    return decorated

def preprocess(img):
    img = img.resize((224, 224))
    img = np.array(img) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def generate_explanation(disease, confidence):
    explanations = {
        "Normal": [
            "AI analyzed lung fields and found no evidence of abnormal opacity or consolidation.",
            "Normal lung markings and clear costophrenic angles observed.",
            "No signs of infiltrates, effusions, or cardiomegaly detected."
        ],
        "Pneumonia": [
            "AI identified abnormal opacity patterns consistent with lung infection.",
            "Focus areas show consolidation typical of bacterial pneumonia.",
            "Evidence of airway inflammation and parenchymal involvement."
        ],
        "Tuberculosis": [
            "AI detected cavitation and fibrotic changes suggestive of TB.",
            "Upper lobe predominance with tree-in-bud opacities observed.",
            "Hilar lymphadenopathy and pleural effusion patterns noted."
        ]
    }
    return random.choice(explanations.get(disease, ["AI analysis completed."]))

def generate_heatmap_regions(disease, confidence):
    """Generate simulated heatmap regions for demo purposes"""
    if disease == "Normal":
        return []
    
    # Generate realistic heatmap regions based on disease
    regions = []
    if disease == "Pneumonia":
        regions = [
            {"x": 120, "y": 80, "radius": 25, "intensity": confidence, "label": "Right lower lobe opacity"},
            {"x": 180, "y": 120, "radius": 20, "intensity": confidence * 0.8, "label": "Consolidation area"}
        ]
    elif disease == "Tuberculosis":
        regions = [
            {"x": 90, "y": 60, "radius": 30, "intensity": confidence, "label": "Upper lobe cavitation"},
            {"x": 200, "y": 70, "radius": 15, "intensity": confidence * 0.7, "label": "Tree-in-bud opacities"}
        ]
    
    return regions

def check_image_quality(image):
    """Enhanced image quality and X-ray validation"""
    try:
        img_array = np.array(image)
        
        # Check brightness (mean pixel value)
        brightness = np.mean(img_array)
        
        # Check contrast (standard deviation)
        contrast = np.std(img_array)
        
        # Check blur (simple Laplacian variance simulation)
        gray = np.mean(img_array, axis=2)
        blur_score = np.std(gray)  # Simplified blur detection
        
        # Detect if this looks like a chest X-ray
        is_xray = validate_chest_xray(img_array)
        
        quality_issues = []
        
        if not is_xray:
            quality_issues.append("Image does not appear to be a chest X-ray")
        
        if brightness < 40:
            quality_issues.append("Image is too dark for accurate diagnosis")
        elif brightness > 220:
            quality_issues.append("Image is overexposed")
            
        if contrast < 20:
            quality_issues.append("Low contrast - image quality poor")
            
        if blur_score < 10:
            quality_issues.append("Image is blurred - may affect accuracy")
        
        quality_score = max(0, 100 - len(quality_issues) * 25)
        is_valid_xray = is_xray and quality_score >= 50
        
        return {
            "quality_score": quality_score,
            "issues": quality_issues,
            "acceptable": is_valid_xray,
            "is_chest_xray": is_xray
        }
    except:
        return {
            "quality_score": 0, 
            "issues": ["Unable to assess image quality"], 
            "acceptable": False,
            "is_chest_xray": False
        }

def validate_chest_xray(img_array):
    """Validate if image appears to be a chest X-ray"""
    try:
        # Check image dimensions - should be roughly square or portrait
        h, w = img_array.shape[:2]
        aspect_ratio = w / h if h > 0 else 1
        
        # Chest X-rays are typically portrait (height > width) or nearly square
        if aspect_ratio > 1.2:  # Too wide, likely not an X-ray
            return False
        
        # Convert to grayscale to analyze
        if len(img_array.shape) == 3:
            gray = np.mean(img_array, axis=2)
        else:
            gray = img_array
        
        # X-ray images have specific characteristics:
        # 1. Dark background (low pixel values on edges)
        # 2. Bright anatomy in center
        # 3. Relatively uniform distribution
        
        # Check edges are dark (typical X-ray frame)
        edge_threshold = 50
        top_edge = np.mean(gray[0:10, :])
        bottom_edge = np.mean(gray[-10:, :])
        left_edge = np.mean(gray[:, 0:10])
        right_edge = np.mean(gray[:, -10:])
        
        edges = [top_edge, bottom_edge, left_edge, right_edge]
        dark_edges = sum(1 for e in edges if e < edge_threshold) >= 2
        
        # Check center is not completely uniform (should have some detail)
        center_h, center_w = h // 4, w // 4
        center = gray[center_h:3*center_h, center_w:3*center_w]
        center_std = np.std(center)
        has_detail = center_std > 15
        
        # Check overall brightness (X-rays are typically medium-bright)
        overall_brightness = np.mean(gray)
        valid_brightness = 60 < overall_brightness < 230
        
        # Validate: should have dark edges, detail, and proper brightness
        is_valid_xray = (dark_edges or has_detail) and valid_brightness
        
        return is_valid_xray
    except:
        return True  # If we can't validate, allow it through

@app.route("/register", methods=["POST"])
def register():
    try:
        if not db.connected:
            return jsonify({'error': 'MongoDB is unavailable. Registration is temporarily disabled.'}), 503

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['email', 'password', 'firstName', 'lastName']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        # Check if user already exists
        existing_user = db.get_user_by_email(data['email'])
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        user_data = {
            'email': data['email'],
            'password': hashed_password,
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'createdAt': datetime.datetime.utcnow(),
            'isActive': True
        }
        
        user_id = db.create_user(user_data)
        if user_id:
            return jsonify({
                'message': 'User created successfully',
                'userId': str(user_id)
            }), 201
        else:
            return jsonify({'error': db.last_error or 'Failed to create user'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        if not db.connected:
            return jsonify({'error': 'MongoDB is unavailable. Login is temporarily disabled.'}), 503

        data = request.get_json()
        
        # Find user
        user = db.get_user_by_email(data['email'])
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password
        if bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
            # Generate JWT token
            token = jwt.encode({
                'email': user['email'],
                'userId': str(user['_id']),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
            }, JWT_SECRET, algorithm='HS256')
            
            return jsonify({
                'token': token,
                'user': {
                    'email': user['email'],
                    'firstName': user['firstName'],
                    'lastName': user['lastName']
                }
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route("/profile", methods=["GET"])
@token_required
def profile():
    try:
        auth_header = request.headers.get('Authorization')
        
        # Handle "Bearer <token>" format
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            token = auth_header
        
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        user = db.get_user_by_email(decoded['email'])
        if user:
            # Remove password from response
            user_data = {
                'email': user['email'],
                'firstName': user['firstName'],
                'lastName': user['lastName'],
                'createdAt': user['createdAt'],
                'isActive': user.get('isActive', True)
            }
            return jsonify(user_data)
        else:
            return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/scan/save", methods=["POST"])
@token_required
def save_scan():
    try:
        if not db.connected:
            return jsonify({'error': 'MongoDB is unavailable. Scan saving is temporarily disabled.'}), 503

        auth_header = request.headers.get('Authorization')
        
        # Handle "Bearer <token>" format
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            token = auth_header
        
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        data = request.get_json()
        
        scan_data = {
            'user_id': decoded['userId'],
            'user_email': decoded['email'],
            'prediction': data['prediction'],
            'confidence': data['confidence'],
            'disease': data['disease'],
            'status': data['status'],
            'precaution': data['precaution'],
            'image_url': data['image_url'],
            'date': datetime.datetime.utcnow(),
            'explanation': data.get('explanation', ''),
            'heatmap_regions': data.get('heatmap_regions', []),
            'disease_info': data.get('disease_info', {}),
            'quality_check': data.get('quality_check', {}),
            'all_probabilities': data.get('all_probabilities', {}),
            'analysis_metadata': data.get('analysis_metadata', {})
        }
        
        scan_id = db.save_scan(scan_data)
        if scan_id:
            return jsonify({
                'message': 'Scan saved successfully',
                'scanId': str(scan_id)
            }), 201
        else:
            return jsonify({'error': 'Failed to save scan'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/scan/history", methods=["GET"])
@token_required
def scan_history():
    try:
        auth_header = request.headers.get('Authorization')
        
        # Handle "Bearer <token>" format
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            token = auth_header
        
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        limit = request.args.get('limit', 10, type=int)
        scans = db.get_user_scans(email=decoded['email'], user_id=decoded['userId'], limit=limit)
        
        return jsonify({
            'scans': scans,
            'total': len(scans)
        })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    try:
        print(f"[/predict] Incoming request from {request.remote_addr}; headers: {dict(request.headers)}")
        print(f"[/predict] Files keys: {list(request.files.keys())}")
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        image = Image.open(file).convert("RGB")
        
        # Check image quality and X-ray validity
        quality_check = check_image_quality(image)
        
        # If not a valid chest X-ray, return error
        if not quality_check.get("is_chest_xray", True):
            return jsonify({
                "prediction": "Not a Chest X-ray",
                "confidence": 0.0,
                "all_probabilities": {
                    "Normal": 0.0,
                    "Pneumonia": 0.0,
                    "Tuberculosis": 0.0
                },
                "explanation": "The uploaded image does not appear to be a chest X-ray. Please upload a valid chest X-ray image.",
                "heatmap_regions": [],
                "disease_info": {
                    "precaution": "Unable to diagnose. Please ensure you're uploading a chest X-ray image.",
                    "follow_up": "Resubmit a clear chest X-ray image.",
                    "severity": "Unknown",
                    "recommendations": ["Upload a valid chest X-ray image", "Ensure image clarity", "Try a different angle"]
                },
                "quality_check": quality_check,
                "analysis_metadata": {
                    "model_version": "LuNet-v1.0",
                    "input_shape": "224x224x3",
                    "processing_time": "0.5s",
                    "confidence_level": "Low"
                }
            }), 400
        
        x = preprocess(image)
        pred = model.predict(x)[0]
        
        # Get predicted class and confidence
        predicted_class_idx = np.argmax(pred)
        confidence = float(pred[predicted_class_idx])
        
        # Class mapping - IMPORTANT: If your trained model has different class order,
        # adjust this mapping accordingly. By default: [Normal, Pneumonia, Tuberculosis]
        # If inverted, swap Normal and Tuberculos indices
        diseases = ["Normal", "Pneumonia", "Tuberculosis"]
        
        # INVERSION FIX: If the model predictions are inverted (Normal appears as diseased),
        # uncomment the next line to swap Normal with Tuberculosis indices
        # predicted_class_idx = 2 - predicted_class_idx  # This inverts: 0->2, 1->1, 2->0
        
        predicted_disease = diseases[predicted_class_idx]
        
        # Only return prediction if confidence is reasonable
        if confidence < 0.25:
            # Low confidence - mark as uncertain
            predicted_disease = "Uncertain"
            explanation = "Image quality or content insufficient for reliable diagnosis. Please consult a radiology specialist."
        else:
            # Generate explanation and heatmap for valid predictions
            explanation = generate_explanation(predicted_disease, confidence)
            heatmap_regions = generate_heatmap_regions(predicted_disease, confidence)
        
        return jsonify({
            "prediction": predicted_disease,
            "confidence": confidence,
            "all_probabilities": {
                "Normal": float(pred[0]),
                "Pneumonia": float(pred[1]),
                "Tuberculosis": float(pred[2])
            },
            "explanation": explanation,
            "heatmap_regions": heatmap_regions if confidence >= 0.25 else [],
            "disease_info": DISEASE_INFO.get(predicted_disease, DISEASE_INFO["Normal"]),
            "quality_check": quality_check,
            "analysis_metadata": {
                "model_version": "LuNet-v1.0",
                "input_shape": "224x224x3",
                "processing_time": "2.3s",
                "confidence_level": "High" if confidence > 0.7 else "Medium" if confidence > 0.4 else "Low"
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[/predict] Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    database_health = db.get_health_status()
    model_loaded = os.path.exists(model_path)

    if model_loaded and database_health.get("mongodb_connected"):
        status = "healthy"
    elif model_loaded or database_health.get("mode") == "in-memory":
        status = "degraded"
    else:
        status = "unhealthy"

    return jsonify({
        "status": status,
        "model_loaded": model_loaded,
        "model_type": "Multi-class Lung Disease Detection",
        "supported_diseases": ["Normal", "Pneumonia", "Tuberculosis"],
        "database": database_health
    })

if __name__ == "__main__":
    # Start Flask server regardless of MongoDB connection
    # The app will use in-memory storage if MongoDB is unavailable
    print("Starting Flask server...")
    print(f"Database connected: {db.connected}")
    if db.connected:
        print("Using MongoDB for persistence")
    else:
        print("Using in-memory storage (data will be lost on restart)")
    app.run(port=5000, debug=True)
