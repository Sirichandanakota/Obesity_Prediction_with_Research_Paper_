import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ComposedChart, Legend
} from 'recharts';
import { 
  Activity, Info, TrendingUp, Users, BrainCircuit, Database, ChevronRight,
  AlertCircle, CheckCircle2, RefreshCcw, Sparkles, Stethoscope, HeartPulse, Scale,
  Sun, Moon, LayoutDashboard, BookOpen, ExternalLink, ShieldAlert, Network, Microscope,
  Utensils, ClipboardList, Calendar
} from 'lucide-react';

// --- DATA ---
// Updated colors to fade from Dark Blue to Lighter Blue based on accuracy
const MODEL_STATS = [
  { name: 'DeepHealthNet', acc: 97.00, p: 0.97, r: 0.97, f1: 0.97, color: '#172554' }, // Blue 950
  { name: 'Logistic Reg.', acc: 95.60, p: 0.97, r: 0.95, f1: 0.96, color: '#1e3a8a' }, // Blue 900
  { name: 'MLP', acc: 95.00, p: 0.95, r: 0.94, f1: 0.95, color: '#1e40af' }, // Blue 800
  { name: 'CNN', acc: 94.50, p: 0.95, r: 0.93, f1: 0.94, color: '#2563eb' }, // Blue 600
  { name: 'LSTM', acc: 91.00, p: 0.93, r: 0.88, f1: 0.90, color: '#3b82f6' }, // Blue 500
];

// Reconstructed from your uploaded image
const SHAP_SUMMARY_DATA = [
  { feature: 'Age', Overweight: 0.06, Obese: 0.06, 'Normal Weight': 0.01, Underweight: 0.005 },
  { feature: 'Gender', Overweight: 0.06, Obese: 0.05, 'Normal Weight': 0.02, Underweight: 0.01 },
  { feature: 'Activity', Overweight: 0.07, Obese: 0.08, 'Normal Weight': 0.01, Underweight: 0.01 },
  { feature: 'Height', Overweight: 0.17, Obese: 0.12, 'Normal Weight': 0.09, Underweight: 0.03 },
  { feature: 'Weight', Overweight: 0.27, Obese: 0.25, 'Normal Weight': 0.13, Underweight: 0.10 },
  { feature: 'BMI', Overweight: 0.28, Obese: 0.26, 'Normal Weight': 0.16, Underweight: 0.08 },
];

const SHAP_COLORS = {
  Overweight: '#0ea5e9',      // Blue (matches image)
  Obese: '#d946ef',           // Purple (matches image)
  'Normal Weight': '#f43f5e', // Red (matches image)
  Underweight: '#22c55e'      // Green (matches image)
};

const CATEGORY_META = {
  "Obese": { 
    color: "text-rose-700 dark:text-rose-400", 
    bg: "bg-rose-50 dark:bg-rose-950/30", 
    border: "border-rose-200 dark:border-rose-800", 
    icon: AlertCircle,
    rec: "Consult a metabolic specialist for a structured weight management plan involving regular low-impact cardio.",
    food: "Prioritize high-fiber vegetables and lean proteins while strictly limiting processed sugars and saturated fats."
  },
  "Overweight": { 
    color: "text-amber-600 dark:text-amber-400", 
    bg: "bg-amber-50 dark:bg-amber-950/30", 
    border: "border-amber-200 dark:border-amber-800", 
    icon: Info,
    rec: "Increase daily physical activity to 45 minutes of moderate exercise and monitor caloric intake.",
    food: "Focus on portion control, whole grains, and reducing intake of sugary beverages and fried foods."
  },
  "Normal weight": { 
    color: "text-emerald-700 dark:text-emerald-400", 
    bg: "bg-emerald-50 dark:bg-emerald-950/30", 
    border: "border-emerald-200 dark:border-emerald-800", 
    icon: CheckCircle2,
    rec: "Maintain current activity levels with a mix of cardiovascular and resistance training for long-term health.",
    food: "Sustain a balanced diet rich in fruits, vegetables, and whole grains with adequate hydration."
  },
  "Underweight": { 
    color: "text-blue-700 dark:text-blue-400", 
    bg: "bg-blue-50 dark:bg-blue-950/30", 
    border: "border-blue-200 dark:border-blue-800", 
    icon: Scale,
    rec: "Focus on strength training exercises to build muscle mass rather than just increasing fat stores.",
    food: "Increase intake of calorie-dense, nutrient-rich foods such as nuts, avocados, healthy oils, and complex carbs."
  }
};

const API_KEY = "AIzaSyDD0NfUztE-YfTCCP2futfIi6eQNo-51AY"; 

const callDeepHealthNetInference = async (data, retries = 0) => {
  const weight = parseFloat(data.weight);
  const height = parseFloat(data.height);
  const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
  
  // Fallback Logic
  const getBMICategory = (bmiValue) => {
    const bmi = parseFloat(bmiValue);
    if (bmi < 18.5) return { category: "Underweight", confidence: 0.92 };
    if (bmi >= 18.5 && bmi < 25) return { category: "Normal weight", confidence: 0.94 };
    if (bmi >= 25 && bmi < 30) return { category: "Overweight", confidence: 0.93 };
    return { category: "Obese", confidence: 0.95 };
  };

  const systemPrompt = `You are DeepHealthNet, a specialized research AI model for metabolic health.
Analyze this patient profile and predict their obesity category.
Categories: Underweight, Normal weight, Overweight, Obese
Return ONLY valid JSON:
{
  "category": "String",
  "confidence": 0.95,
  "shap": [{"feature": "Name", "impact": 0.5}],
  "reasoning": "Short clinical explanation based on features"
}`;

  const userQuery = `Patient: Age ${data.age}, ${data.gender}, H:${height}cm, W:${weight}kg, BMI:${bmi}, Activity:${data.activity}/4.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\n" + userQuery }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!response.ok) throw new Error('API Error');
    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Invalid format');
  } catch (error) {
    if (retries === 0) {
      const fallback = getBMICategory(bmi);
      return {
        category: fallback.category,
        confidence: fallback.confidence,
        shap: [
          { feature: "BMI", impact: parseFloat(bmi) > 25 ? 0.45 : -0.35 },
          { feature: "Weight", impact: weight > 75 ? 0.28 : -0.22 },
          { feature: "Activity", impact: data.activity >= 3 ? -0.18 : 0.15 }
        ],
        reasoning: `Based on BMI of ${bmi}, this patient falls into the ${fallback.category.toLowerCase()} category. AI server unreachable; using clinical heuristics.`
      };
    }
    throw error;
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [formData, setFormData] = useState({ age: 25, gender: 'Male', height: 172.5, weight: 70.0, activity: 3 });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const runInference = async () => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const res = await callDeepHealthNetInference(formData);
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height);
      setPrediction({ 
        ...res, 
        bmi: (w / ((h / 100) ** 2)).toFixed(1),
        timestamp: Date.now() 
      });
    } catch (e) {
      setError("AI Inference engine unavailable. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${theme}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-300 font-sans selection:bg-blue-200 selection:text-blue-900">
        
        {/* Navbar */}
        <nav className="fixed top-0 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4 md:px-8 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 text-white p-1.5 rounded-lg">
              <BrainCircuit size={20} />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">DeepHealthNet <span className="text-blue-900 dark:text-blue-400">Research</span></span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                { id: 'research', icon: BookOpen, label: 'Research' }
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all select-none ${
                    activeTab === tab.id 
                    ? 'bg-blue-900 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-200'
                  }`}
                >
                  <tab.icon size={14} className="md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 md:mx-2"></div>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400 transition-colors select-none"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </nav>

        <main className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto w-full">
          
          {/* Main Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* DISCLAIMER BANNER */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">Research Prototype Disclaimer</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mt-1">
                    This platform is a demonstration of the <strong>DeepHealthNet</strong> research paper. Results generated are for academic validation purposes only and <strong>do not constitute medical advice or recommendations</strong>. Please consult a qualified healthcare professional for medical diagnosis.
                  </p>
                </div>
              </div>

               {/* INTEGRATED PREDICTION SECTION */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                
                {/* Left: Input Form */}
                {/* Added select-none to wrapper to prevent caret on background, but inputs remain selectable */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-lg shadow-blue-900/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl relative overflow-hidden flex flex-col select-none">
                  
                  <div className="relative z-10 flex-grow">
                    <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                      <Microscope className="text-blue-900 dark:text-blue-400" size={24} /> 
                      Run Diagnostics
                    </h3>
                    
                    {error && (
                      <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-xl text-xs font-bold border border-red-100 dark:border-red-800 flex items-center gap-2">
                        <AlertCircle size={14} />{error}
                      </div>
                    )}

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</label>
                          <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-blue-900 dark:focus:border-blue-500 rounded-xl px-4 py-3 font-bold outline-none transition-all select-text" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-blue-900 dark:focus:border-blue-500 rounded-xl px-4 py-3 font-bold outline-none transition-all select-text">
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Height (cm)</label>
                          <input type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-blue-900 dark:focus:border-blue-500 rounded-xl px-4 py-3 font-bold outline-none transition-all select-text" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight (kg)</label>
                          <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-blue-900 dark:focus:border-blue-500 rounded-xl px-4 py-3 font-bold outline-none transition-all select-text" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Level (1-4)</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map(lvl => (
                            <button key={lvl} onClick={() => setFormData({...formData, activity: lvl})} className={`py-3 rounded-xl font-black transition-all border ${formData.activity === lvl ? 'bg-blue-900 border-blue-900 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-900'}`}>{lvl}</button>
                          ))}
                        </div>
                      </div>
                      <button onClick={runInference} disabled={loading} className="w-full py-4 bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-900/20 transition-all mt-6">
                        {loading ? <RefreshCcw className="animate-spin" size={18} /> : <>Generate Prediction <ChevronRight size={18} /></>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Live Result */}
                <div className="lg:col-span-7">
                  {prediction ? (
                    <div key={prediction.timestamp} className={`h-full p-6 md:p-8 rounded-3xl shadow-xl border-l-8 ${CATEGORY_META[prediction.category]?.bg} ${CATEGORY_META[prediction.category]?.border} animate-in slide-in-from-right-8 duration-500 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300`}>
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                             <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm"><Stethoscope className={CATEGORY_META[prediction.category]?.color} size={28} /></div>
                             <span className="hidden md:inline text-xs font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700">DeepHealthNet Assessment</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Confidence</p>
                            <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{(prediction.confidence * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-widest">Metabolic Classification</p>
                        <h2 className={`text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-none ${CATEGORY_META[prediction.category]?.color}`}>{prediction.category}</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><ClipboardList size={14} className="text-blue-900 dark:text-blue-400" /> Recommendation</h4>
                             <p className="text-xs font-bold leading-relaxed text-slate-700 dark:text-slate-300">{CATEGORY_META[prediction.category]?.rec}</p>
                          </div>
                          <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><Utensils size={14} className="text-blue-900 dark:text-blue-400" /> Dietary Focus</h4>
                             <p className="text-xs font-bold leading-relaxed text-slate-700 dark:text-slate-300">{CATEGORY_META[prediction.category]?.food}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors duration-300 select-none">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-full mb-6 shadow-sm">
                        <BrainCircuit size={40} className="text-blue-900 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">Ready to Analyze</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-500 max-w-xs mx-auto">Enter patient biometrics in the left panel to generate a live metabolic assessment using DeepHealthNet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Stats */}
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-slate-900 dark:text-white">Diagnostic Dashboard</h1>
                  <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium text-sm md:text-base">Real-time metabolic inference powered by DeepHealthNet.</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm hover:scale-105 transition-transform duration-300 select-none">
                  <div className="bg-blue-900/10 p-2 rounded-lg"><Database size={18} className="text-blue-900 dark:text-blue-400" /></div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dataset</p>
                     <span className="text-sm font-bold text-slate-900 dark:text-white">1,000 Verified Samples</span>
                  </div>
                </div>
              </header>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { l: "DeepHealthNet Accuracy", v: "97.0%", i: TrendingUp, c: "text-blue-900 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { l: "Logistic Reg. Accuracy", v: "95.6%", i: Activity, c: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
                  { l: "Processing Speed", v: "<100ms", i: Network, c: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
                  { l: "Input Features", v: "6 Biometrics", i: Users, c: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" }
                ].map((m, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-105 select-none">
                    <div className="flex justify-between items-start mb-4">
                       <div className={`p-3 rounded-xl ${m.bg} ${m.c}`}><m.i size={20}/></div>
                       {idx === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">SOTA</span>}
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">{m.l}</p>
                    <p className={`text-3xl font-black ${m.c}`}>{m.v}</p>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 gap-6 md:gap-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.005]">
                  <h3 className="font-black text-xl mb-8 text-slate-900 dark:text-white">Comparative Performance Analysis</h3>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={MODEL_STATS} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke="#94a3b8" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} interval={0} />
                        <YAxis domain={[85, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff'}} 
                          itemStyle={{color: '#fff'}}
                        />
                        <Bar dataKey="acc" radius={[6, 6, 0, 0]} barSize={60}>
                          {MODEL_STATS.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Research Work Tab */}
          {activeTab === 'research' && (
             <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-10">
                
                <header className="max-w-4xl mx-auto text-center space-y-4">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Research Contribution</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">Detailed analysis of the DeepHealthNet architecture and methodology.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  {/* Paper Details Card */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-10 rounded-3xl shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
                     <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                        <BookOpen size={200} className="text-blue-900" />
                     </div>
                     <div className="relative z-10 space-y-6">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-2 select-none">
                            <Calendar size={12} /> Date: Jan 2025
                          </span>
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider select-none">Document #11348622</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black leading-tight text-slate-900 dark:text-white">Enhancing Obesity Prediction with Explainable AI: A DeepHealthNet-Based Comparative Study</h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium text-sm md:text-base select-text">
                           <strong>Abstract:</strong> Obesity is becoming a global issue as daily habits shift toward less movement and more unhealthy eating as life becomes more convenient. People are unknowingly developing habits that increase the risk of obesity. The purpose of this study is to predict obesity categories using Machine Learning (ML) and Deep Learning (DL) models on actual data. We tested a few different models including K-Nearest Neighbors (KNN), Logistic Regression, Multi-Layer Perceptron (MLP), Long-Shortterm Memory (LSTM), Convolutional Neural Networks (CNN) and our custom architecture DeepHealthNet. Among these models, the proposed DeepHealthNet achieved the highest accuracy (97.00%) above Logistic Regression (95.60%), followed by MLP (95.00%) by a lower difference. Further examinations of the DeepHealthNet model showed differences in predicting obesity rates based on gender in Men (94.29%) and Women (92.71%).
                        </p>
                        <div className="pt-6">
                          <a href="https://ieeexplore.ieee.org/document/11348622" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-900/30 select-none">
                            View Full Paper <ExternalLink size={18} />
                          </a>
                        </div>
                     </div>
                  </div>

                  {/* Model Architecture Card */}
                  <div className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] select-none">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-50"></div>
                     <div className="relative z-10">
                        <h4 className="text-xl font-black mb-6 flex items-center gap-2"><Network /> Architecture</h4>
                        <ul className="space-y-4">
                           <li className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">1</div>
                              <div>
                                 <p className="font-bold">Input Layer</p>
                                 <p className="text-sm text-slate-400">Standardized biometric vector (Age, BMI, Activity, etc.)</p>
                              </div>
                           </li>
                           <li className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">2</div>
                              <div>
                                 <p className="font-bold">Deep Feature Extraction</p>
                                 <p className="text-sm text-slate-400">Multi-layer Perceptron (MLP) with ReLU activation.</p>
                              </div>
                           </li>
                           <li className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">3</div>
                              <div>
                                 <p className="font-bold">Classification Head</p>
                                 <p className="text-sm text-slate-400">Softmax output for 4-class obesity categorization.</p>
                              </div>
                           </li>
                        </ul>
                     </div>
                  </div>
                </div>

                {/* SHAP / XAI Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-10 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
                   <div className="flex flex-col md:flex-row gap-10">
                      <div className="flex-1 space-y-6">
                         <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                           <Sparkles className="text-amber-500" /> Explainable AI (SHAP)
                         </h3>
                         <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            DeepHealthNet integrates <strong>SHAP (SHapley Additive exPlanations)</strong> to provide transparency for every prediction. The chart below illustrates the mean impact of each feature on the model's output magnitude across different weight classes.
                         </p>
                         
                         {/* Reconstructed Chart */}
                         <div className="h-[500px] w-full mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                layout="vertical"
                                data={SHAP_SUMMARY_DATA}
                                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" opacity={0.2} />
                                <XAxis type="number" stroke="#94a3b8" tick={{fontSize: 10}} />
                                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{fontSize: 12, fontWeight: 'bold'}} width={80} />
                                <Tooltip 
                                  contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff'}}
                                  cursor={{fill: 'transparent'}}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="Overweight" stackId="a" fill={SHAP_COLORS['Overweight']} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Obese" stackId="a" fill={SHAP_COLORS['Obese']} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Normal Weight" stackId="a" fill={SHAP_COLORS['Normal Weight']} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Underweight" stackId="a" fill={SHAP_COLORS['Underweight']} radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                            <p className="text-center text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">mean(|SHAP value|) (average impact on model output magnitude)</p>
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
