const API_BASE_URL = 'http://localhost:5000';

export interface DiseaseInfo {
  precaution: string;
  follow_up: string;
  severity: string;
  recommendations: string[];
}

export interface HeatmapRegion {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  label: string;
}

export interface QualityCheck {
  quality_score: number;
  issues: string[];
  acceptable: boolean;
}

export interface AnalysisMetadata {
  model_version: string;
  input_shape: string;
  processing_time: string;
  confidence_level: string;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  all_probabilities: {
    Normal: number;
    Pneumonia: number;
    Tuberculosis: number;
  };
  explanation: string;
  heatmap_regions: HeatmapRegion[];
  disease_info: DiseaseInfo;
  quality_check: QualityCheck;
  analysis_metadata: AnalysisMetadata;
}

export const api = {
  async healthCheck(): Promise<{ status: string; model_loaded: boolean; model_type: string; supported_diseases: string[] }> {
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
