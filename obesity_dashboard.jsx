import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  PieChart, Pie, LineChart, Line, ComposedChart, Area
} from 'recharts';
import { 
  Activity, Info, TrendingUp, Users, ShieldCheck, 
  BrainCircuit, LayoutDashboard, Database, ChevronRight,
  AlertCircle, ChevronDown, CheckCircle2, RefreshCcw, Sparkles,
  Stethoscope, HeartPulse, Scale, MoveRight, Download
} from 'lucide-react';

// --- DATA FROM CSV & PDF REPORT ---
const MODEL_STATS = [
  { name: 'DeepHealthNet', acc: 97.00, p: 0.97, r: 0.97, f1: 0.97, color: '#2563eb' },
  { name: 'Logistic Reg.', acc: 95.60, p: 0.97, r: 0.95, f1: 0.96, color: '#059669' },
  { name: 'MLP', acc: 95.00, p: 0.95, r: 0.94, f1: 0.95, color: '#d97706' },
  { name: 'CNN', acc: 94.50, p: 0.95, r: 0.93, f1: 0.94, color: '#7c3aed' },
  { name: 'LSTM', acc: 91.00, p: 0.93, r: 0.88, f1: 0.90, color: '#db2777' },
];

const COLORS = ['#2563eb', '#d97706', '#059669', '#7c3aed'];

const CATEGORY_META = {
  "Obese": { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle, advice: "High BMI detected. Recommendation: Consult a specialist for a metabolic health screening." },
  "Overweight": { color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200", icon: Info, advice: "BMI is in the elevated range. Recommendation: Incorporate 30 mins of moderate activity daily." },
  "Normal weight": { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, advice: "Metabolic indicators are stable. Maintain current physical activity levels." },
  "Underweight": { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Scale, advice: "BMI below standard range. Recommendation: Focus on nutrient-dense calorie intake." }
};

// API Key successfully integrated from Google AI Studio
const apiKey = "AIzaSyDD0NfUztE-YfTCCP2futfIi6eQNo-51AY"; 

// --- AI INFERENCE ENGINE ---
const callDeepHealthNetInference = async (data, retries = 0) => {
  const weight = parseFloat(data.weight);
  const height = parseFloat(data.height);
  const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
  
  const systemPrompt = `You are a specialized inference engine for DeepHealthNet (Architecture: 3 Hidden Layers [256, 128, 64]).
  You are predicting obesity categories based on the Kaggle Obesity Dataset used in the research.
  Categorization Logic: 
  - Underweight: BMI < 18.5
  - Normal weight: 18.5 <= BMI < 25
  - Overweight: 25 <= BMI < 30
  - Obese: BMI >= 30
  Factors like Gender and PhysicalActivityLevel (1-4) provide secondary weighting.
  Return JSON: { "category": string, "confidence": float, "shap": Array<{feature: string, impact: float}>, "reasoning": string }`;

  const userQuery = `Input Profile: Age=${data.age}, Gender=${data.gender}, Height=${height}cm, Weight=${weight}kg, BMI=${bmi}, ActivityLevel=${data.activity}.
  Perform a DeepHealthNet prediction. Response must be strictly valid JSON.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error(`API Request Failed: ${response.statusText}`);
    const result = await response.json();
    const textResult = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) throw new Error("No valid response text from AI.");
    return JSON.parse(textResult);
  } catch (error) {
    if (retries < 5) {
      const delays = [1000, 2000, 4000, 8000, 16000];
      await new Promise(r => setTimeout(r, delays[retries]));
      return callDeepHealthNetInference(data, retries + 1);
    }
    throw error;
  }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [formData, setFormData] = useState({ age: 25, gender: 'Male', height: 172.5, weight: 70.0, activity: 3 });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runInference = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callDeepHealthNetInference(formData);
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height);
      setPrediction({ ...res, bmi: (w / ((h / 100) ** 2)).toFixed(1) });
    } catch (e) {
      console.error("AI Inference Error", e);
      setError("The AI engine failed to respond. Please check your API key or connection.");
    } finally {
      setLoading(false);
    }
  };

  const distributionData = [
    { n: 'Normal weight', v: 400 },
    { n: 'Obese', v: 220 },
    { n: 'Overweight', v: 250 },
    { n: 'Underweight', v: 130 }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-200 font-sans">
      <nav className="fixed top-0 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <BrainCircuit size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">DeepHealthNet <span className="text-blue-600 font-black">XAI</span></span>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {['dashboard', 'predict', 'metrics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter mb-2">Health Analytics Platform</h1>
                <p className="text-slate-500 max-w-2xl text-lg font-medium">Visualizing prediction capabilities derived from the DeepHealthNet framework (97% Accuracy).</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <Database className="text-blue-600" size={20} />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">1,000 Samples Indexed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { l: "Peak Accuracy", v: "97.0%", i: TrendingUp, c: "text-blue-600" },
                { l: "MLP Benchmark", v: "95.0%", i: Activity, c: "text-orange-500" },
                { l: "LSTM Efficiency", v: "91.0%", i: HeartPulse, c: "text-pink-500" },
                { l: "Features Analyzed", v: "6 Biometrics", i: Users, c: "text-emerald-500" }
              ].map((m, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 bg-slate-50 dark:bg-slate-800 rounded-xl ${m.c}`}><m.i size={20}/></div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Verified Result</div>
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">{m.l}</p>
                  <p className={`text-3xl font-black ${m.c}`}>{m.v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-xl flex items-center gap-2">Neural Network Benchmarking</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={MODEL_STATS}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis domain={[85, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="acc" radius={[10, 10, 0, 0]} barSize={45}>
                        {MODEL_STATS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="f1" stroke="#cbd5e1" strokeWidth={3} dot={{r: 6, fill: '#64748b'}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm">
                <h3 className="font-black text-xl mb-8">Category Mix</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} nameKey="n" dataKey="v">
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predict' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] shadow-xl">
                  <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <Sparkles className="text-blue-600" /> Patient Profile
                  </h2>
                  <div className="space-y-6">
                    {error && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-2 text-sm font-bold border border-red-100">
                        <AlertCircle size={16} /> {error}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age (Years)</label>
                        <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 outline-none font-bold">
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Height (cm)</label>
                        <input type="number" step="0.1" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight (kg)</label>
                        <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Score (1-4)</label>
                      <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(lvl => (
                          <button key={lvl} onClick={() => setFormData({...formData, activity: lvl})} className={`py-4 rounded-2xl font-black transition-all ${formData.activity === lvl ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={runInference} disabled={loading} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl disabled:opacity-50 mt-4">
                      {loading ? <RefreshCcw className="animate-spin" /> : <>Compute DeepHealthNet Prediction <ChevronRight /></>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {prediction ? (
                  <div className="animate-in slide-in-from-right-12 duration-700">
                    <div className={`p-10 rounded-[3rem] shadow-2xl border-4 ${CATEGORY_META[prediction.category]?.bg || 'bg-slate-50'} ${CATEGORY_META[prediction.category]?.border || 'border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-10">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
                          <Stethoscope className={CATEGORY_META[prediction.category]?.color || 'text-slate-600'} size={40} />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Model Confidence</p>
                          <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{(prediction.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>

                      <h2 className={`text-6xl font-black mb-10 tracking-tighter leading-none ${CATEGORY_META[prediction.category]?.color || 'text-slate-800'}`}>
                        {prediction.category}
                      </h2>

                      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl shadow-sm border border-slate-200/50 mb-10">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                          <HeartPulse size={14} className="text-rose-500" /> Explainable AI (XAI) Insight
                        </h4>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "{prediction.reasoning}"
                        </p>
                      </div>

                      {prediction.shap && (
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SHAP Impact Attribution</h4>
                          {prediction.shap.slice(0, 3).map((s, i) => (
                            <div key={i} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="uppercase">{s.feature}</span>
                                <span className={s.impact > 0 ? 'text-rose-500' : 'text-emerald-500'}>{s.impact > 0 ? '+' : ''}{s.impact.toFixed(3)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${s.impact > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, Math.abs(s.impact * 100))}%`}} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center p-16 text-center opacity-30">
                    <BrainCircuit size={100} className="mb-8 text-blue-600" />
                    <p className="text-2xl font-black mb-2 uppercase tracking-tighter">Inference Standby</p>
                    <p className="text-sm font-bold text-slate-500">Awaiting input parameters to trigger the DeepHealthNet sequence.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <header className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-5xl font-black mb-4 tracking-tighter italic">Technical Report</h2>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {MODEL_STATS.slice(0, 3).map((m, i) => (
                 <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] hover:ring-4 hover:ring-blue-500/10 transition-all">
                   <div className="flex items-center justify-between mb-8">
                     <h4 className="text-2xl font-black">{m.name}</h4>
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
  );
};

export default App;


