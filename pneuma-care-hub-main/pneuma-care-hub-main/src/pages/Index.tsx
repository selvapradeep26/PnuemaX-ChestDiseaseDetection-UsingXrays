import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Microscope,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
} from "lucide-react";
import logo from "@/assets/logo.png";

const valueCards = [
  {
    icon: Brain,
    title: "AI-assisted screening",
    description: "PneumaX helps analyze uploaded chest X-rays and highlights likely respiratory findings with confidence-led outputs.",
  },
  {
    icon: ClipboardList,
    title: "Structured explanations",
    description: "Each result is paired with disease context, precaution guidance, and a readable report flow for end users.",
  },
  {
    icon: Activity,
    title: "Trackable workflow",
    description: "Users can move from account creation to upload, review, and scan history in one connected experience.",
  },
];

const steps = [
  {
    icon: Upload,
    title: "1. Upload an X-ray",
    description: "Users submit a chest X-ray image through the web interface for preprocessing and analysis.",
  },
  {
    icon: Microscope,
    title: "2. Run model inference",
    description: "The backend prepares the image, runs the detection model, and returns probabilities and supporting metadata.",
  },
  {
    icon: Stethoscope,
    title: "3. Review guidance",
    description: "The interface presents prediction details, image-quality notes, and follow-up recommendations in plain language.",
  },
];

const trustPoints = [
  "Designed as an assistive screening experience, not a replacement for clinicians.",
  "Current system supports Normal, Pneumonia, and Tuberculosis prediction flows.",
  "Medical recommendations are framed as guidance and should always be reviewed by professionals.",
];

const stats = [
  { label: "Primary focus", value: "Chest X-ray screening" },
  { label: "Core conditions", value: "3 detection classes" },
  { label: "Workflow goal", value: "Fast guided review" },
  { label: "Experience type", value: "AI-assisted, human-checked" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(240,248,255,0.88))]" />

      <header className="sticky top-0 z-20 border-b border-white/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-2 shadow-card">
              <img src={logo} alt="PneumaX" className="h-9 w-9" />
            </div>
            <div>
              <p className="text-lg font-display font-bold text-foreground">PneumaX</p>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">AI Respiratory Insight Platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#about" className="transition hover:text-foreground">About</a>
            <a href="#workflow" className="transition hover:text-foreground">Workflow</a>
            <a href="#trust" className="transition hover:text-foreground">Trust</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              state={{ fromHome: true }}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              Login
            </Link>
            <Link
              to="/signup"
              state={{ fromHome: true }}
              className="gradient-medical rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground shadow-medical transition hover:opacity-90"
            >
              Signup
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-info/20 bg-info/10 px-4 py-2 text-sm text-info">
              <Sparkles className="h-4 w-4" />
              Respiratory screening experience built around explainable AI outputs
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-display font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                PneumaX helps teams review chest X-rays with a faster, guided AI workflow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                We are building a medical web platform that combines image upload, AI-based prediction, result explanation,
                and scan history into one experience. The goal is to make early respiratory screening easier to access,
                easier to interpret, and easier to follow up on.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                state={{ fromHome: true }}
                className="gradient-medical inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-medical transition hover:opacity-90"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Learn What PneumaX Does
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-card backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 text-lg font-semibold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-8 h-24 w-24 rounded-full bg-info/15 blur-2xl" />
            <div className="absolute -right-4 bottom-8 h-24 w-24 rounded-full bg-success/20 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.28)] backdrop-blur-sm">
              <div className="rounded-[1.5rem] gradient-auth-panel p-6 text-auth-panel-foreground">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-auth-panel-foreground/60">Platform Snapshot</p>
                    <h2 className="mt-3 text-2xl font-display font-bold">What we are doing</h2>
                  </div>
                  <ShieldCheck className="h-10 w-10 text-cyan-300" />
                </div>

                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-auth-panel-foreground/70">Mission</p>
                    <p className="mt-2 text-base font-medium">
                      Support earlier awareness of lung abnormalities through explainable AI-assisted image screening.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-auth-panel-foreground/70">Current strength</p>
                    <p className="mt-2 text-base font-medium">
                      End-to-end product flow is already in place: auth, upload, prediction response, and history review.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-auth-panel-foreground/70">Current truth</p>
                    <p className="mt-2 text-base font-medium">
                      This is still a project-stage platform and should be presented as assistive technology, not final clinical proof.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="border-y border-border/70 bg-white/70 py-20 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 max-w-3xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-info">About PneumaX</p>
              <h2 className="text-3xl font-display font-bold text-foreground sm:text-4xl">
                A homepage-worthy story should explain the product clearly, not just look polished.
              </h2>
              <p className="text-base leading-8 text-muted-foreground">
                PneumaX is a chest X-ray screening platform focused on helping users upload scans, receive structured AI predictions,
                and understand next-step guidance faster. It is part diagnostic interface, part AI explanation layer, and part user-facing care workflow.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {valueCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-[1.75rem] border border-border bg-background p-7 shadow-card">
                    <div className="mb-5 inline-flex rounded-2xl bg-info/10 p-3 text-info">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-foreground">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-success">How It Works</p>
                <h2 className="text-3xl font-display font-bold text-foreground sm:text-4xl">
                  The product flow is simple on purpose.
                </h2>
                <p className="text-base leading-8 text-muted-foreground">
                  The experience is designed to feel familiar: create an account, upload an image, review the model response,
                  and keep a record of scans over time. That makes PneumaX feel closer to a usable platform than a single demo screen.
                </p>
              </div>

              <div className="space-y-5">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-4 rounded-[1.75rem] border border-border bg-white p-6 shadow-card">
                      <div className="mt-1 rounded-2xl bg-success/10 p-3 text-success">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="bg-[linear-gradient(180deg,rgba(237,247,255,0.85),rgba(255,255,255,0.95))] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[2rem] border border-info/15 bg-white p-8 shadow-card">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-warning">How Successful Is It?</p>
                <h2 className="mt-4 text-3xl font-display font-bold text-foreground sm:text-4xl">
                  Strong as a platform prototype, still honest about clinical maturity.
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  Right now, the most credible way to talk about success is this: PneumaX already demonstrates the product journey well,
                  and it shows how AI screening can be packaged into a clean user experience. What it does not yet show is a validated clinical success claim.
                </p>

                <div className="mt-8 space-y-4">
                  {trustPoints.map((point) => (
                    <div key={point} className="flex gap-3 rounded-2xl bg-accent/40 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      <p className="text-sm leading-7 text-foreground/85">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-warning/20 bg-warning/5 p-8 shadow-card">
                <div className="flex items-center gap-3">
                  <CircleAlert className="h-6 w-6 text-warning" />
                  <h3 className="text-2xl font-display font-bold text-foreground">Transparency matters</h3>
                </div>

                <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
                  <p>
                    If you want this homepage to feel like a serious health-tech product, the best positioning is to emphasize
                    explainability, workflow clarity, and assistive decision support.
                  </p>
                  <p>
                    If you later add benchmarked model results, test-set metrics, or institutional validation, this section can evolve into
                    a stronger proof block with exact numbers. For now, we should avoid invented performance claims.
                  </p>
                </div>

                <div className="mt-8 rounded-[1.5rem] bg-white p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Recommended positioning</p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    “PneumaX is an AI-assisted respiratory screening platform built to support faster review, better explanation, and clearer follow-up.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20 pt-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-[2rem] gradient-auth-panel p-8 text-auth-panel-foreground shadow-[0_24px_70px_-30px_rgba(15,23,42,0.5)] sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-auth-panel-foreground/60">Ready To Explore?</p>
                  <h2 className="mt-3 text-3xl font-display font-bold sm:text-4xl">
                    See the product flow from account creation to scan review.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-auth-panel-foreground/75">
                    Start with the current platform, test the upload journey, and keep building toward a more validated and production-ready clinical experience.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    state={{ fromHome: true }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-auth-panel-foreground"
                  >
                    Start With PneumaX
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    state={{ fromHome: true }}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-auth-panel-foreground transition hover:bg-white/10"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
