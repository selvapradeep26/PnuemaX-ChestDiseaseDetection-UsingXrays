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

export interface User {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ScanRecord {
  _id: string;
  user_email: string;
  prediction: string;
  confidence: number;
  disease: string;
  status: string;
  precaution: string;
  image_url: string;
  date: string;
  explanation?: string;
  heatmap_regions?: HeatmapRegion[];
  disease_info?: DiseaseInfo;
  quality_check?: QualityCheck;
  all_probabilities?: any;
  analysis_metadata?: any;
}

class AuthAPI {
  private static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pneumax_token');
    }
    return null;
  }

  private static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pneumax_token', token);
    }
  }

  private static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pneumax_token');
    }
  }

  private static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': token } : {};
  }

  static async register(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<{ message: string; userId?: string }> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      ...this.getAuthHeaders()
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  static async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    // Store token
    this.setToken(data.token);
    
    return data;
  }

  static async logout(): Promise<void> {
    this.removeToken();
    // Optional: Call backend to invalidate token
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  static async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  }
}

class ScanAPI {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('pneumax_token');
    return token ? { 'Authorization': token } : {};
  }

  static async saveScan(scanData: Omit<ScanRecord, '_id'>): Promise<{ message: string; scanId: string }> {
    const response = await fetch(`${API_BASE_URL}/scan/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(scanData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save scan');
    }

    return response.json();
  }

  static async getScanHistory(limit: number = 10): Promise<{ scans: ScanRecord[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/scan/history?limit=${limit}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get scan history');
    }

    return response.json();
  }
}

export const api = {
  // Original endpoints (still work for predictions)
  async healthCheck(): Promise<{ status: string; model_loaded: boolean; model_type: string; supported_diseases: string[]; database: any }> {
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
  },

  // Authentication endpoints
  auth: AuthAPI,

  // Scan management endpoints
  scans: ScanAPI
};
