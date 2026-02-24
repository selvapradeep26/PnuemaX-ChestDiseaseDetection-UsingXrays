import { api } from './api';

// Test function to verify backend connection
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const health = await api.healthCheck();
    console.log('Backend health check:', health);
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};

// Test prediction with a dummy image
export const testPrediction = async () => {
  try {
    // Create a simple test image blob
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 224, 224);
    }
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
        const result = await api.predictImage(file);
        console.log('Prediction result:', result);
      }
    }, 'image/jpeg');
  } catch (error) {
    console.error('Prediction test failed:', error);
  }
};
