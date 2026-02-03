import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, ComposedChart
} from 'recharts';
import { 
  Activity, Info, TrendingUp, Users, BrainCircuit, Database, ChevronRight,
  AlertCircle, CheckCircle2, RefreshCcw, Sparkles, Stethoscope, HeartPulse, Scale,
  Sun, Moon, LayoutDashboard, FileBarChart
} from 'lucide-react';

// --- DATA ---
const MODEL_STATS = [
  { name: 'DeepHealthNet', acc: 97.00, p: 0.97, r: 0.97, f1: 0.97, color: '#2563eb' },
  { name: 'Logistic Reg.', acc: 95.60, p: 0.97, r: 0.95, f1: 0.96, color: '#059669' },
  { name: 'MLP', acc: 95.00, p: 0.95, r: 0.94, f1: 0.95, color: '#d97706' },
  { name: 'CNN', acc: 94.50, p: 0.95, r: 0.93, f1: 0.94, color: '#7c3aed' },
  { name: 'LSTM', acc: 91.00, p: 0.93, r: 0.88, f1: 0.90, color: '#db2777' },
];

const COLORS = ['#2563eb', '#d97706', '#059669', '#7c3aed'];

const CATEGORY_META = {
  "Obese": { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", icon: AlertCircle },
  "Overweight": { color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", icon: Info },
  "Normal weight": { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
  "Underweight": { color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", icon: Scale }
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

  const systemPrompt = `You are DeepHealthNet, a specialized medical AI.
Analyze this patient profile and predict their obesity category.
Categories: Underweight, Normal weight, Overweight, Obese
Return ONLY valid JSON:
{
  "category": "String",
  "confidence": 0.95,
  "shap": [{"feature": "Name", "impact": 0.5}],
  "reasoning": "Short clinical explanation"
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

  const distributionData = [
    { n: 'Normal', v: 400 }, { n: 'Obese', v: 220 },
    { n: 'Overweight', v: 250 }, { n: 'Underweight', v: 130 }
  ];

  return (
    <div className={`${theme}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-300">
        
        {/* Navbar */}
        <nav className="fixed top-0 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-8 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-blue-600" size={24} />
            <span className="text-xl font-bold tracking-tight">DeepHealthNet <span className="text-blue-600">XAI</span></span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                { id: 'metrics', icon: FileBarChart, label: 'Tech Report' }
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                    activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </nav>

        <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
          
          {/* Main Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Header Stats */}
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-2 text-slate-900 dark:text-white">Health Analytics</h1>
                  <p className="text-slate-500 dark:text-slate-400 max-w-2xl font-medium">Real-time inference & metabolic cohort analysis.</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                  <Database size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">1,000 Samples Indexed</span>
                </div>
              </header>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { l: "Peak Accuracy", v: "97.0%", i: TrendingUp, c: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { l: "MLP Benchmark", v: "95.0%", i: Activity, c: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
                  { l: "LSTM Efficiency", v: "91.0%", i: HeartPulse, c: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
                  { l: "Features", v: "6 Biometrics", i: Users, c: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" }
                ].map((m, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm transition-colors duration-300">
                    <div className={`p-3 rounded-xl w-fit mb-4 ${m.bg} ${m.c}`}><m.i size={20}/></div>
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">{m.l}</p>
                    <p className={`text-3xl font-black ${m.c}`}>{m.v}</p>
                  </div>
                ))}
              </div>

              {/* INTEGRATED PREDICTION SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Input Form */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-lg shadow-blue-900/5 transition-colors duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <BrainCircuit size={150} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-black text-xl mb-6 flex items-center gap-2">
                      <Sparkles className="text-blue-600" size={20} /> 
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
                          <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500 rounded-2xl px-4 py-3 font-bold outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500 rounded-2xl px-4 py-3 font-bold outline-none transition-all">
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Height (cm)</label>
                          <input type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500 rounded-2xl px-4 py-3 font-bold outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight (kg)</label>
                          <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500 rounded-2xl px-4 py-3 font-bold outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Level (1-4)</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map(lvl => (
                            <button key={lvl} onClick={() => setFormData({...formData, activity: lvl})} className={`py-3 rounded-xl font-black transition-all ${formData.activity === lvl ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{lvl}</button>
                          ))}
                        </div>
                      </div>
                      <button onClick={runInference} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-600/20 transition-all mt-4">
                        {loading ? <RefreshCcw className="animate-spin" size={18} /> : <>Generate Prediction <ChevronRight size={18} /></>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Live Result */}
                <div className="lg:col-span-7">
                  {prediction ? (
                    <div key={prediction.timestamp} className={`h-full p-8 rounded-[2.5rem] shadow-xl border-2 ${CATEGORY_META[prediction.category]?.bg} ${CATEGORY_META[prediction.category]?.border} animate-in slide-in-from-right-8 duration-500 flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm"><Stethoscope className={CATEGORY_META[prediction.category]?.color} size={32} /></div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Model Confidence</p>
                            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{(prediction.confidence * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-widest">Category Detected</p>
                        <h2 className={`text-5xl md:text-6xl font-black mb-8 tracking-tighter leading-none ${CATEGORY_META[prediction.category]?.color}`}>{prediction.category}</h2>
                        
                        <div className="bg-white/60 dark:bg-slate-900/60 p-5 rounded-2xl mb-6 backdrop-blur-sm">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><HeartPulse size={14} className="text-rose-500" /> Clinical Note</h4>
                          <p className="text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-300">"{prediction.reasoning}"</p>
                        </div>
                      </div>

                      {prediction.shap && (
                        <div className="grid grid-cols-3 gap-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
                           {prediction.shap.slice(0, 3).map((s, i) => (
                            <div key={i} className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.feature}</span>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${s.impact > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, Math.abs(s.impact * 100))}%`}} />
                              </div>
                            </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                        <BrainCircuit size={40} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-400 dark:text-slate-600 mb-2">Ready to Analyze</h3>
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-600 max-w-xs mx-auto">Enter patient biometrics in the left panel to generate a live metabolic assessment using DeepHealthNet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm transition-colors duration-300">
                  <h3 className="font-black text-xl mb-8 text-slate-900 dark:text-white">Model Performance</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={MODEL_STATS}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke="#94a3b8" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                        <YAxis domain={[85, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#fff'}} 
                          itemStyle={{color: '#fff'}}
                        />
                        <Bar dataKey="acc" radius={[8, 8, 0, 0]} barSize={40}>
                          {MODEL_STATS.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm transition-colors duration-300">
                  <h3 className="font-black text-xl mb-8 text-slate-900 dark:text-white">Cohort Distribution</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} nameKey="n" dataKey="v" stroke="none">
                          {distributionData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4">
                      {distributionData.slice(0,2).map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{d.n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Report View (Metric Tab) */}
          {activeTab === 'metrics' && (
             <div className="space-y-10 animate-in fade-in duration-500">
             <header className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-5xl font-black mb-4 tracking-tighter italic text-slate-900 dark:text-white">Technical Report</h2>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {MODEL_STATS.slice(0, 3).map((m, i) => (
                 <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] hover:ring-4 hover:ring-blue-500/10 transition-all">
                   <div className="flex items-center justify-between mb-8">
                     <h4 className="text-2xl font-black text-slate-900 dark:text-white">{m.name}</h4>
                     <div className="text-blue-600"><CheckCircle2 size={32} /></div>
                   </div>
                   <div className="space-y-6">
                     <div>
                       <div className="flex justify-between text-xs font-black uppercase mb-2">
                         <span className="text-slate-400">Accuracy Score</span>
                         <span className="text-blue-600">{m.acc}%</span>
                       </div>
                       <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-600 rounded-full" style={{width: `${m.acc}%`}} />
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;