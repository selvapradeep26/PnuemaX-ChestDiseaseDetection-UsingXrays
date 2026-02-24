import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import authBg from "@/assets/auth-bg.jpg";
import logo from "@/assets/logo.png";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields"); return; }
    const ok = login(email, password);
    if (ok) navigate("/dashboard");
    else setError("Invalid email or password");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] gradient-auth-panel relative overflow-hidden flex-col justify-between p-10">
        <div className="absolute inset-0 opacity-20">
          <img src={authBg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <img src={logo} alt="PneumaX" className="h-10 w-10" />
            <span className="text-xl font-display font-bold text-auth-panel-foreground">PneumaX</span>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          <h2 className="text-3xl font-display font-bold text-auth-panel-foreground leading-tight">
            AI-Powered<br />Lung Disease Detection
          </h2>
          <p className="text-auth-panel-foreground/60 text-sm max-w-xs">
            Upload your chest X-ray and get instant, simulated diagnostic insights.
          </p>
        </div>
        <div className="relative z-10" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={logo} alt="PneumaX" className="h-9 w-9" />
            <span className="text-lg font-display font-bold text-foreground">PneumaX</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your account to continue</p>

          {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full gradient-medical text-primary-foreground font-medium rounded-lg py-2.5 text-sm hover:opacity-90 transition shadow-medical">
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
