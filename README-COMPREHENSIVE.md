# PneumaX - AI-Powered Lung Disease Detection System

A comprehensive full-stack web application for detecting lung diseases from chest X-ray images using advanced machine learning techniques.

## 🏥 Features

- **🤖 AI-Powered Detection**: Real-time lung disease analysis using TensorFlow
- **🔬 Disease Classification**: Detects Pneumonia, Tuberculosis, and Normal conditions
- **📊 Confidence Scoring**: Detailed prediction confidence with visual indicators
- **👤 User Authentication**: Secure login/signup system with scan history
- **📱 Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS
- **🔗 Full-Stack Integration**: Flask backend API with React frontend
- **📋 Scan History**: Track and review previous X-ray analyses
- **⚡ Real-time Processing**: Fast image upload and prediction

## 🏗️ Architecture

### Backend (Flask + TensorFlow)
- **Framework**: Flask with CORS support
- **ML Engine**: TensorFlow/Keras for deep learning predictions
- **Image Processing**: PIL and NumPy for preprocessing
- **API Endpoints**: RESTful API for health checks and predictions

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API
- **HTTP Client**: Fetch API with error handling

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd Backend
pip install -r requirnments.txt
python app.py
```
Backend runs on `http://localhost:5000`

### Frontend Setup
```bash
cd pneuma-care-hub-main/pneuma-care-hub-main
npm install
npm run dev
```
Frontend runs on `http://localhost:8080`

### Quick Launch
```bash
# Run the batch script to start both servers
start-app.bat
```

## 📡 API Documentation

### Health Check
```
GET /health
Response: {"status": "healthy", "model_loaded": boolean}
```

### Disease Prediction
```
POST /predict
Body: FormData with 'file' field (image)
Response: {
  "prediction": "Pneumonia|Tuberculosis|Normal",
  "confidence": 0.85,
  "explanation": "AI analysis details...",
  "disease_info": {
    "precaution": "Medical advice...",
    "follow_up": "Follow-up recommendations...",
    "severity": "Low|Medium|High"
  }
}
```

## 🧠 Model Information

- **Input Size**: 224x224 pixels
- **Supported Formats**: JPEG, PNG
- **Classes**: Normal, Pneumonia, Tuberculosis
- **Preprocessing**: Normalization and resizing
- **Current Status**: Demo model (production model in training)

## 🔧 Development

### Project Structure
```
Pneumax/
├── Backend/                 # Flask API server
│   ├── app.py              # Main application
│   ├── requirnments.txt    # Python dependencies
│   └── chest_xray/         # ML training scripts
├── pneuma-care-hub-main/   # React frontend
│   └── pneuma-care-hub-main/
│       ├── src/
│       │   ├── pages/      # React components
│       │   ├── lib/        # API services
│       │   └── components/ # UI components
│       └── package.json    # Node dependencies
├── start-app.bat           # Startup script
└── README-SETUP.md         # Detailed setup guide
```

### Key Technologies
- **Backend**: Python, Flask, TensorFlow, PIL, NumPy
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide icons
- **Development**: ESLint, Vitest for testing

## 🩺 Disease Information

### Pneumonia
- **Detection**: Lung inflammation and consolidation
- **Precaution**: Antibiotics, rest, hydration
- **Follow-up**: 2-3 days with primary care

### Tuberculosis
- **Detection**: Cavitation and upper lobe changes
- **Precaution**: Anti-TB medication, isolation
- **Follow-up**: Immediate pulmonologist referral

### Normal
- **Detection**: No abnormal findings
- **Precaution**: Regular health maintenance
- **Follow-up**: Routine check-ups

## 🔒 Security & Ethics

- **Medical Disclaimer**: AI assistance, not replacement for medical diagnosis
- **Data Privacy**: Local storage, no external data transmission
- **Error Handling**: Graceful fallbacks and user guidance
- **Responsible AI**: Clear confidence indicators and limitations

## 📈 Future Enhancements

- [ ] Multi-disease classification (14 chest conditions)
- [ ] Real doctor consultation integration
- [ ] Mobile application development
- [ ] Advanced explainability with Grad-CAM
- [ ] DICOM format support
- [ ] Cloud deployment with scalability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational and research purposes. Please ensure compliance with medical device regulations if used in clinical settings.

## 🙏 Acknowledgments

- Medical imaging community for dataset contributions
- TensorFlow team for ML framework
- Open source community for tools and libraries

---

**⚠️ Disclaimer**: This tool assists clinical decision-making and does not replace radiologist diagnosis. Always consult healthcare professionals for medical concerns.
