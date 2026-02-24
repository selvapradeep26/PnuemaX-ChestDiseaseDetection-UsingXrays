from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

# Check if model exists, otherwise create a dummy model for testing
model_path = "output/models/LuNet.h5"
if os.path.exists(model_path):
    model = tf.keras.models.load_model(model_path, compile=False)
    print(f"Model loaded from {model_path}")
else:
    # Create a simple dummy model for testing
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 3)),
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    print("Warning: Using dummy model - actual model not found at", model_path)

def preprocess(img):
    img = img.resize((224, 224))
    img = np.array(img) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        image = Image.open(file).convert("RGB")
        x = preprocess(image)

        pred = model.predict(x)[0]
        confidence = float(pred.max())

        result = "Possible Lung Disease" if confidence > 0.5 else "Normal"

        return jsonify({
            "prediction": result,
            "confidence": confidence
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model_loaded": os.path.exists(model_path)})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
