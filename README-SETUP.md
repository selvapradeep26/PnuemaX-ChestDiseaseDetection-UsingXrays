# PneumaX - Lung Disease Detection System

A full-stack web application for AI-powered lung disease detection from chest X-ray images.

## Architecture

- **Backend**: Flask API with TensorFlow for ML predictions
- **Frontend**: React + TypeScript with Vite
- **UI**: Tailwind CSS + shadcn/ui components

## Setup Instructions

### Prerequisites

1. Python 3.12+
2. Node.js 18+
3. npm or yarn

### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirnments.txt
   ```

3. Start the Flask server:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd pneuma-care-hub-main/pneuma-care-hub-main
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:8080`

### Quick Start

Run the provided batch script to start both servers:

```bash
start-app.bat
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns: `{ "status": "healthy", "model_loaded": boolean }`

### Prediction
- **POST** `/predict`
- Body: FormData with `file` field (image)
- Returns: `{ "prediction": string, "confidence": number }`

## Features

- ✅ Real-time X-ray image analysis
- ✅ AI-powered disease detection
- ✅ Confidence score display
- ✅ User authentication system
- ✅ Scan history tracking
- ✅ Responsive design
- ✅ Error handling with fallback

## Model Information

- **Current Status**: Using dummy model for testing
- **Expected Model**: `output/models/LuNet.h5`
- **Input Size**: 224x224 pixels
- **Supported Formats**: JPEG, PNG

## Development Notes

- The backend includes CORS support for frontend integration
- Fallback to simulated predictions if API fails
- Model training scripts available in `chest_xray/` directory
- All dependencies are compatible with Python 3.12

## Testing

1. Both servers should be running
2. Access the frontend at `http://localhost:8080`
3. Login or create an account
4. Upload a chest X-ray image
5. View AI-powered prediction results

## Future Enhancements

- [ ] Train and integrate the actual LuNet model
- [ ] Add more disease classifications
- [ ] Implement real-time processing
- [ ] Add doctor consultation features
- [ ] Mobile app development
