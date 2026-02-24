import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext-mongodb";
import logo from "@/assets/logo.png";
import { Upload, LogOut, AlertCircle, CheckCircle, ShieldAlert, Image, ChevronDown, ChevronUp, Download, Activity, TrendingUp, Info } from "lucide-react";
import { api, PredictionResponse, DiseaseInfo, HeatmapRegion } from "@/lib/api-mongodb";

interface PredictionResult {
  disease: string;
  status: "Detected" | "Not Detected";
  precaution: string;
  confidence?: number;
  explanation?: string;
  heatmap_regions?: HeatmapRegion[];
  disease_info?: DiseaseInfo;
  quality_check?: any;
  all_probabilities?: any;
  analysis_metadata?: any;
}

interface ScanRecord {
  _id: string;
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
  quality_check?: any;
  all_probabilities?: any;
  analysis_metadata?: any;
}

const Dashboard = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [history, setHistory] = useState<Array<{ image: string; result: PredictionResult; date: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load scan history from MongoDB
  useEffect(() => {
    if (user) {
      loadScanHistory();
    }
  }, [user]);

  const loadScanHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.scans.getScanHistory(10);
      if (response.scans) {
        // Transform MongoDB scans to Dashboard format
        const formattedHistory = response.scans.map((scan: any) => ({
          _id: scan._id,
          image: scan.image_url,
          result: {
            disease: scan.disease,
            status: scan.status,
            precaution: scan.precaution,
            confidence: scan.confidence,
            explanation: scan.explanation,
            heatmap_regions: scan.heatmap_regions,
            disease_info: scan.disease_info,
            quality_check: scan.quality_check,
            all_probabilities: scan.all_probabilities,
            analysis_metadata: scan.analysis_metadata
          },
          date: new Date(scan.date).toLocaleString()
        }));
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveScanToMongoDB = async (predictionResult: PredictionResult, dataUrl: string) => {
    try {
      await api.scans.saveScan({
        prediction: predictionResult.disease,
        confidence: predictionResult.confidence || 0,
        disease: predictionResult.disease,
        status: predictionResult.status,
        precaution: predictionResult.precaution,
        image_url: dataUrl,
        explanation: predictionResult.explanation,
        heatmap_regions: predictionResult.heatmap_regions,
        disease_info: predictionResult.disease_info,
        quality_check: predictionResult.quality_check,
        all_probabilities: predictionResult.all_probabilities,
        analysis_metadata: predictionResult.analysis_metadata
      });
    } catch (error) {
      console.error('Failed to save scan to MongoDB:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence < 0.4) return "bg-green-500";
    if (confidence < 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence < 0.4) return "Low";
    if (confidence < 0.7) return "Medium";
    return "High";
  };

  const getHistoryInsights = () => {
    const recentScans = history.slice(0, 30); // Last 30 scans
    const abnormalScans = recentScans.filter(scan => scan.result.status === "Detected");
    const normalScans = recentScans.filter(scan => scan.result.status === "Not Detected");
    
    return {
      totalScans: recentScans.length,
      abnormalCount: abnormalScans.length,
      normalCount: normalScans.length,
      abnormalityRate: recentScans.length > 0 ? (abnormalScans.length / recentScans.length * 100).toFixed(1) : "0",
      hasRepeatAbnormality: abnormalScans.length > 1
    };
  };

  const downloadReport = () => {
    if (!prediction || !imagePreview) return;
    
    const reportContent = `
PNEUMAX AI LUNG DISEASE DETECTION REPORT
==========================================
Date: ${new Date().toLocaleString()}
Patient: ${user?.firstName} ${user?.lastName}

ANALYSIS RESULTS
-----------------
Disease Detected: ${prediction.disease}
Status: ${prediction.status}
Confidence: ${(prediction.confidence! * 100).toFixed(1)}%
Confidence Level: ${getConfidenceLevel(prediction.confidence!)}

AI EXPLANATION
--------------
${prediction.explanation || "No explanation available"}

MEDICAL RECOMMENDATIONS
----------------------
${prediction.precaution}

Follow-up: ${prediction.disease_info?.follow_up || "Consult healthcare provider"}

Severity: ${prediction.disease_info?.severity || "Unknown"}

SPECIFIC RECOMMENDATIONS
-----------------------
${prediction.disease_info?.recommendations?.join("\n") || "No specific recommendations"}

IMAGE QUALITY
-------------
Quality Score: ${prediction.quality_check?.quality_score || "N/A"}%
${prediction.quality_check?.issues?.join("\n") || ""}

MODEL INFORMATION
----------------
Model Version: ${prediction.analysis_metadata?.model_version || "Unknown"}
Processing Time: ${prediction.analysis_metadata?.processing_time || "Unknown"}
Input Shape: ${prediction.analysis_metadata?.input_shape || "Unknown"}

---
DISCLAIMER: This AI-assisted prediction is for informational purposes only and does not replace professional medical diagnosis. Always consult qualified healthcare providers for medical decisions.
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PneumaX_Report_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      try {
        const result = await api.predictImage(file);
        
        // Check image quality
        if (!result.quality_check.acceptable) {
          setShowQualityWarning(true);
        }
        
        const predictionResult: PredictionResult = {
          disease: result.prediction,
          status: result.prediction === "Normal" ? "Not Detected" : "Detected",
          confidence: result.confidence,
          precaution: result.disease_info.precaution,
          explanation: result.explanation,
          heatmap_regions: result.heatmap_regions,
          disease_info: result.disease_info,
          quality_check: result.quality_check,
          all_probabilities: result.all_probabilities,
          analysis_metadata: result.analysis_metadata
        };
        
        setPrediction(predictionResult);
        
        // Save to MongoDB
        await saveScanToMongoDB(predictionResult, dataUrl);
        
      } catch (error) {
        console.error('Prediction failed:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => { 
    await logout(); 
    navigate("/login"); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

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
        {/* History Insights */}
        {history.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Your Scan Insights (MongoDB)</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{getHistoryInsights().totalScans}</div>
                <div className="text-xs text-blue-700">Total Scans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getHistoryInsights().abnormalCount}</div>
                <div className="text-xs text-red-700">Abnormal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getHistoryInsights().normalCount}</div>
                <div className="text-xs text-green-700">Normal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getHistoryInsights().abnormalityRate}%</div>
                <div className="text-xs text-blue-700">Abnormality Rate</div>
              </div>
            </div>
            {getHistoryInsights().hasRepeatAbnormality && (
              <div className="mt-3 flex items-center gap-2 bg-orange-100 rounded px-3 py-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">Repeat abnormality detected - consider follow-up consultation</span>
              </div>
            )}
          </div>
        )}

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
              {prediction ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Header with Download */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-lg text-foreground">AI Analysis Results</h3>
                    <button
                      onClick={downloadReport}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download Report
                    </button>
                  </div>

                  {/* Disease Status */}
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
                      {prediction.disease_info?.severity && (
                        <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                          prediction.disease_info.severity === "High" ? "bg-red-100 text-red-800" :
                          prediction.disease_info.severity === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {prediction.disease_info.severity} Severity
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confidence Visualization */}
                  {prediction.confidence && (
                    <div className="bg-accent/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">AI Confidence</span>
                        <span className="text-sm text-muted-foreground">{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${getConfidenceColor(prediction.confidence)}`}
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-3 h-3 rounded-full ${getConfidenceColor(prediction.confidence)}`} />
                        <span className="text-xs text-muted-foreground">
                          {getConfidenceLevel(prediction.confidence)} confidence level
                        </span>
                      </div>
                    </div>
                  )}

                  {/* All Probabilities */}
                  {prediction.all_probabilities && (
                    <div className="bg-accent/30 rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground mb-2">All Disease Probabilities</p>
                      <div className="space-y-2">
                        {Object.entries(prediction.all_probabilities).map(([disease, prob]) => (
                          <div key={disease} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{disease}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full bg-blue-500"
                                  style={{ width: `${(prob as number) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {((prob as number) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Explanation */}
                  {prediction.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Why this prediction?</span>
                        </div>
                        {showExplanation ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
                      </button>
                      {showExplanation && (
                        <div className="mt-3 text-sm text-blue-800">
                          <p>{prediction.explanation}</p>
                          <p className="mt-2 text-xs text-blue-600 italic">
                            AI focused on abnormal opacity regions and patterns consistent with {prediction.disease.toLowerCase()}.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Heatmap Visualization */}
                  {prediction.heatmap_regions && prediction.heatmap_regions.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-medium text-red-900 mb-2">AI Attention Regions</p>
                      <div className="text-sm text-red-800">
                        <p>AI identified {prediction.heatmap_regions.length} regions of interest:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {prediction.heatmap_regions.map((region, idx) => (
                            <li key={idx} className="text-xs">
                              {region.label} (confidence: {(region.intensity * 100).toFixed(1)}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Medical Recommendations */}
                  <div className="bg-accent/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-accent-foreground mb-1">Medical Recommendations</p>
                        <p className="text-sm text-foreground/80">{prediction.precaution}</p>
                        {prediction.disease_info?.follow_up && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <strong>Follow-up:</strong> {prediction.disease_info.follow_up}
                          </p>
                        )}
                        {prediction.disease_info?.recommendations && prediction.disease_info.recommendations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-accent-foreground">Specific Actions:</p>
                            <ul className="list-disc list-inside mt-1">
                              {prediction.disease_info.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-xs text-foreground/80">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Medical Disclaimer */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <button
                      onClick={() => setShowDisclaimer(!showDisclaimer)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-xs font-medium text-gray-700">Medical Disclaimer & Safety Information</span>
                      {showDisclaimer ? <ChevronUp className="h-3 w-3 text-gray-600" /> : <ChevronDown className="h-3 w-3 text-gray-600" />}
                    </button>
                    {showDisclaimer && (
                      <div className="mt-3 text-xs text-gray-600 space-y-2">
                        <p>
                          <strong>Important:</strong> This tool assists clinical decision-making and does not replace radiologist diagnosis.
                        </p>
                        <p>
                          The AI predictions are for informational purposes only and should not be used as the sole basis for medical decisions.
                          Always consult qualified healthcare professionals for diagnosis and treatment.
                        </p>
                        <p>
                          The accuracy of predictions may be affected by image quality, patient factors, and model limitations.
                          This system is designed to supplement, not replace, professional medical judgment.
                        </p>
                      </div>
                    )}
                  </div>
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
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Your Scan History (MongoDB)</h2>
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
