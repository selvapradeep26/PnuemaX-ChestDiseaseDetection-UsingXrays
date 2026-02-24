const API_BASE_URL = 'http://localhost:5000';

export interface PredictionResponse {
  prediction: string;
  confidence: number;
}

export const api = {
  async healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  },

  async predictImage(file: File): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Prediction failed');
    }

    return response.json();
  }
};
