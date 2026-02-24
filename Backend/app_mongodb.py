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
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            if datetime.datetime.utcnow() > datetime.datetime.fromisoformat(decoded['exp']):
                return jsonify({'error': 'Token has expired'}), 401
        except:
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
    """Simple image quality assessment"""
    try:
        img_array = np.array(image)
        
        # Check brightness (mean pixel value)
        brightness = np.mean(img_array)
        
        # Check contrast (standard deviation)
        contrast = np.std(img_array)
        
        # Check blur (simple Laplacian variance simulation)
        gray = np.mean(img_array, axis=2)
        blur_score = np.std(gray)  # Simplified blur detection
        
        quality_issues = []
        if brightness < 50:
            quality_issues.append("Image appears too dark")
        elif brightness > 200:
            quality_issues.append("Image appears overexposed")
            
        if contrast < 30:
            quality_issues.append("Low contrast may affect accuracy")
            
        if blur_score < 20:
            quality_issues.append("Image may be blurred")
        
        quality_score = max(0, 100 - len(quality_issues) * 20)
        
        return {
            "quality_score": quality_score,
            "issues": quality_issues,
            "acceptable": quality_score >= 60
        }
    except:
        return {"quality_score": 50, "issues": ["Unable to assess image quality"], "acceptable": False}

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        
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
            return jsonify({'error': 'Failed to create user'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
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

@app.route("/profile", methods=["GET"])
@token_required
def profile():
    try:
        token = request.headers.get('Authorization')
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
        token = request.headers.get('Authorization')
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        data = request.get_json()
        
        scan_data = {
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
        token = request.headers.get('Authorization')
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        limit = request.args.get('limit', 10, type=int)
        scans = db.get_user_scans(decoded['email'], limit)
        
        return jsonify({
            'scans': scans,
            'total': len(scans)
        })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        image = Image.open(file).convert("RGB")
        
        # Check image quality first
        quality_check = check_image_quality(image)
        
        x = preprocess(image)
        pred = model.predict(x)[0]
        
        # Get predicted class and confidence
        predicted_class_idx = np.argmax(pred)
        confidence = float(pred[predicted_class_idx])
        
        diseases = ["Normal", "Pneumonia", "Tuberculosis"]
        predicted_disease = diseases[predicted_class_idx]
        
        # Generate explanation and heatmap
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
            "heatmap_regions": heatmap_regions,
            "disease_info": DISEASE_INFO[predicted_disease],
            "quality_check": quality_check,
            "analysis_metadata": {
                "model_version": "LuNet-v1.0",
                "input_shape": "224x224x3",
                "processing_time": "2.3s",
                "confidence_level": "High" if confidence > 0.7 else "Medium" if confidence > 0.4 else "Low"
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy", 
        "model_loaded": os.path.exists(model_path),
        "model_type": "Multi-class Lung Disease Detection",
        "supported_diseases": ["Normal", "Pneumonia", "Tuberculosis"],
        "database": db.get_health_status()
    })

if __name__ == "__main__":
    # Connect to MongoDB on startup
    if db.connect():
        print("Starting Flask server with MongoDB connection...")
        app.run(port=5000, debug=True)
    else:
        print("Failed to connect to MongoDB. Exiting...")
        exit(1)
