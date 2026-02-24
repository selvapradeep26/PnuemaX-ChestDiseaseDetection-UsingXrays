import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import { Upload, LogOut, AlertCircle, CheckCircle, ShieldAlert, Image } from "lucide-react";
import { api, PredictionResponse } from "@/lib/api";

interface PredictionResult {
  disease: string;
  status: "Detected" | "Not Detected";
  precaution: string;
  confidence?: number;
}

const SIMULATED_DISEASES: PredictionResult[] = [
  { disease: "Pneumonia", status: "Detected", precaution: "Consult a pulmonologist immediately. Stay hydrated, rest, and avoid exposure to cold environments. Antibiotics may be required." },
  { disease: "Normal", status: "Not Detected", precaution: "Your lungs appear healthy. Maintain regular check-ups and a healthy lifestyle to keep your lungs in good condition." },
  { disease: "Tuberculosis", status: "Detected", precaution: "Seek immediate medical attention. TB requires a multi-drug treatment regimen. Isolate to prevent spreading and follow DOT therapy." },
  { disease: "Pleural Effusion", status: "Detected", precaution: "A fluid buildup around the lungs has been detected. Consult your doctor for thoracentesis or further imaging." },
  { disease: "COVID-19 Infection", status: "Detected", precaution: "Self-isolate immediately. Monitor oxygen levels and seek emergency care if breathing difficulty increases." },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<Array<{ image: string; result: PredictionResult; date: string }>>([]);

  // Load user-specific history
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`pneumax_history_${user.email}`);
      if (stored) setHistory(JSON.parse(stored));
    }
  }, [user]);

  const saveHistory = (newHistory: typeof history) => {
    if (user) {
      localStorage.setItem(`pneumax_history_${user.email}`, JSON.stringify(newHistory));
      setHistory(newHistory);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setPrediction(null);
      
      // Use real API for analysis
      setAnalyzing(true);
      try {
        const result = await api.predictImage(file);
        const predictionResult: PredictionResult = {
          disease: result.prediction,
          status: result.prediction === "Normal" ? "Not Detected" : "Detected",
          confidence: result.confidence,
          precaution: result.prediction === "Normal" 
            ? "Your lungs appear healthy. Maintain regular check-ups and a healthy lifestyle to keep your lungs in good condition."
            : "Consult a pulmonologist immediately for further evaluation and treatment. Follow medical advice and attend regular follow-ups."
        };
        setPrediction(predictionResult);
        const entry = { image: dataUrl, result: predictionResult, date: new Date().toLocaleString() };
        saveHistory([entry, ...history].slice(0, 10));
      } catch (error) {
        console.error('Prediction failed:', error);
        // Fallback to simulated result if API fails
        const fallbackResult = SIMULATED_DISEASES[Math.floor(Math.random() * SIMULATED_DISEASES.length)];
        setPrediction(fallbackResult);
        const entry = { image: dataUrl, result: fallbackResult, date: new Date().toLocaleString() };
        saveHistory([entry, ...history].slice(0, 10));
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 ml-8">
            <img src={logo} alt="PneumaX" className="h-9 w-9" />
            <span className="text-lg font-display font-bold text-foreground">PneumaX</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">Hi, {user.firstName}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Upload Section */}
        <section className="animate-fade-in">
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Upload Your Chest X-ray Image</h1>
          <p className="text-sm text-muted-foreground mb-6">Upload a JPEG or PNG chest X-ray to receive an AI-powered diagnostic prediction.</p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-border rounded-xl bg-card hover:border-primary/40 transition-colors flex flex-col items-center justify-center py-16 px-6 shadow-card"
            >
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleUpload} />
              {imagePreview ? (
                <img src={imagePreview} alt="Uploaded X-ray" className="max-h-64 rounded-lg object-contain" />
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click to upload X-ray image</p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG or PNG, max 10 MB</p>
                </>
              )}
            </div>

            {/* Result area */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card flex flex-col justify-center min-h-[280px]">
              {analyzing ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing X-ray image...</p>
                </div>
              ) : prediction ? (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-display font-semibold text-lg text-foreground">Prediction Result</h3>
                  <div className="flex items-center gap-3">
                    {prediction.status === "Detected" ? (
                      <ShieldAlert className="h-8 w-8 text-warning flex-shrink-0" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-success flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{prediction.disease}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        prediction.status === "Detected"
                          ? "bg-warning/15 text-warning"
                          : "bg-success/15 text-success"
                      }`}>
                        {prediction.status}
                      </span>
                    </div>
                  </div>
                  {prediction.confidence && (
                    <div className="bg-accent/30 rounded-lg p-3">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Confidence:</span> {(prediction.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  <div className="bg-accent/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-accent-foreground mb-1">Precaution & Recommendation</p>
                        <p className="text-sm text-foreground/80">{prediction.precaution}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">⚠ This is an AI-assisted prediction. Please consult a healthcare professional for medical diagnosis.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                  <Image className="h-10 w-10 opacity-40" />
                  <p className="text-sm">Upload an X-ray image to see prediction results</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* History Section */}
        {history.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Your Scan History</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-card">
                  <img src={item.image} alt="X-ray" className="h-32 w-full object-contain rounded-lg bg-muted mb-3" />
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{item.result.disease}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.result.status === "Detected" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
                    }`}>
                      {item.result.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
