import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  HardHat,
  Truck,
  CalendarDays,
  TrendingUp,
  Plus,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Menu,
  X,
  Hammer,
  Sparkles,
  Loader2,
  BrainCircuit,
  Pencil,
  Filter,
  User,
  DollarSign,
  Wallet,
  AlertTriangle,
  FileText,
  Building,
  ArrowRightLeft,
  Printer,
  Users,
  HandCoins,
  Banknote,
  Coins,
  Target,
  LayoutDashboard,
  Moon,
  Sun,
  CloudCog,
  Copy,
  Camera,
  Link as LinkIcon,
  ImageIcon,
  FileBarChart,
  Briefcase
} from 'lucide-react';

// --- Imports de Firebase ---
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from 'firebase/auth';

// --- Configuración Híbrida (OPTIMIZADA PARA VERCEL/VITE) ---
const getEnvVar = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

// 1. Configuración de Firebase
let firebaseConfig;
try {
  firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
} catch (e) {
  firebaseConfig = {};
}

if (!firebaseConfig.apiKey) {
  try {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  } catch (e) {
    console.warn("Error leyendo variables de entorno (import.meta.env), usando config vacía", e);
    firebaseConfig = {};
  }
}

// 2. Inicialización Segura de Firebase
let app, auth, db;
if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Error inicializando Firebase:", e);
  }
} else {
  console.warn("⚠️ Firebase no se inicializó. Faltan las variables de entorno (VITE_FIREBASE_API_KEY) en Vercel.");
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'obra-control-prod';

// 3. Configuración API Gemini
let geminiApiKey = "";
if (typeof apiKey !== 'undefined') geminiApiKey = apiKey;
if (!geminiApiKey) geminiApiKey = getEnvVar('VITE_GEMINI_API_KEY');

const callGemini = async (prompt) => {
  if (!geminiApiKey) {
    console.warn("Falta la API Key de Gemini");
    return null;
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) throw new Error(`Error API: ${response.status}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Falló la llamada a Gemini:", error);
    return null;
  }
};

// --- Componentes UI Reutilizables ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", icon: Icon, disabled = false, type = "button" }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
    success: "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800",
    magic: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm",
    ghost: "text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 bg-transparent dark:hover:text-slate-300 dark:hover:bg-slate-800"
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Badge = ({ status }) => {
  const styles = {
    pendiente: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    pedido: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    recibido: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    atrasado: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    en_fecha: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    paused: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  };
  const labels = { pendiente: "Pendiente", pedido: "Pedido", recibido: "En Obra", atrasado: "Atrasado", en_fecha: "En Fecha", active: "En Ejecución", paused: "Pausada" };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.pendiente}`}>{labels[status] || status}</span>;
};

const SyncIndicator = ({ status }) => {
  if (status === 'synced') return <CloudCog size={16} className="text-emerald-500" title="Guardado en la nube" />;
  if (status === 'syncing') return <Loader2 size={16} className="text-blue-500 animate-spin" title="Guardando..." />;
  if (status === 'error') return <AlertTriangle size={16} className="text-red-500" title="Error de conexión a la nube" />;
  return <CloudCog size={16} className="text-slate-400" title="Modo Local / Sin conexión" />;
};

// --- Estructura de Datos Unificada ---
const INITIAL_DB = {
  1: { 
    name: 'Edificio Altos de Alberdi', status: 'active', budget: 15000000, progress: 75,
    logs: [{ id: 1, date: '2023-10-24', weather: 'Soleado', workers: 5, notes: 'Se completó el llenado de zapatas del sector B.', image: '' }],
    materials: [{ id: 1, name: 'Cemento Portland', quantity: '50 bolsas', cost: 250000, status: 'recibido', date: '2023-10-20', provider: 'Corralón Norte', category: 'Albañilería' }],
    stages: [{ id: 1, name: 'Limpieza y Nivelación', progress: 100, contractor: 'Cuadrilla A', totalCost: 150000, paidAmount: 150000 }],
    tasks: [{ id: 1, task: 'Finalizar capa aisladora', deadline: '2023-11-01', completed: false, type: 'labor', assignee: 'Cuadrilla A', progress: 0 }],
    labor: [{ id: 1, name: 'Hormigones SRL', role: 'Estructura', totalBudget: 2500000, paidAmount: 2000000, progress: 85, weeklyRequest: 0 }],
    fees: [{ id: 1, name: 'Dirección Técnica', totalBudget: 1500000, paidAmount: 500000, weeklyRequest: 0 }]
  }
};

// --- Módulos Principales ---
const DailyLog = ({ data, onUpdate }) => {
  const [newLog, setNewLog] = useState({ date: '', weather: 'Soleado', workers: '', notes: '', image: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddLog = () => {
    if (!newLog.date || !newLog.notes) return;
    if (editingId) {
      onUpdate(data.map(l => l.id === editingId ? { ...l, ...newLog } : l));
      setEditingId(null);
    } else {
      onUpdate([{ id: Date.now(), ...newLog }, ...data]);
    }
    setNewLog({ date: '', weather: 'Soleado', workers: '', notes: '', image: '' });
    setIsFormOpen(false);
  };

  const startEdit = (log) => {
    setNewLog({ date: log.date, weather: log.weather, workers: log.workers, notes: log.notes, image: log.image || '' });
    setEditingId(log.id);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setNewLog({ date: '', weather: 'Soleado', workers: '', notes: '', image: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const analyzeLogs = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    const recentLogs = data.slice(0, 5).map(l => `Fecha: ${l.date}, Clima: ${l.weather}, Notas: ${l.notes}`).join('\n');
    const prompt = `Actúa como un Jefe de Obra experto analizando esta bitácora reciente:\n${recentLogs || "Sin datos recientes"}\n\nIdentifica patrones de riesgo (ej: clima, ausentismo, retrasos) y dame 1 recomendación breve y accionable. Responde en texto plano breve.`;
    const result = await callGemini(prompt);
    setAnalysis(result || "No se pudo generar el análisis. Intenta nuevamente.");
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-700 dark:text-slate-200">Bitácora Diaria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Registro histórico de eventos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="magic" onClick={analyzeLogs} icon={isAnalyzing ? Loader2 : BrainCircuit} disabled={isAnalyzing} className={isAnalyzing ? "animate-pulse" : ""}>
            {isAnalyzing ? "Analizando..." : "Analizar Riesgos IA"}
          </Button>
          <Button onClick={() => setIsFormOpen(!isFormOpen)} icon={Plus}>Nueva Entrada</Button>
        </div>
      </div>

      {analysis && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1"><Sparkles size={20} /></span>
          <div><h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-1">Análisis Inteligente</h3><p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed">{analysis}</p></div>
          <button onClick={() => setAnalysis(null)} className="ml-auto text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 self-start"><X size={16} /></button>
        </div>
      )}

      {isFormOpen && (
        <Card className="p-4 bg-blue-50 dark:bg-slate-800/80 border-blue-100 dark:border-blue-900/30">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="date" className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:[color-scheme:dark]" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} />
              <select className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" value={newLog.weather} onChange={e => setNewLog({ ...newLog, weather: e.target.value })}>
                <option>Soleado</option><option>Nublado</option><option>Lluvia</option><option>Viento Fuerte</option>
              </select>
            </div>
            <input type="number" placeholder="Cantidad de operarios" className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newLog.workers} onChange={e => setNewLog({ ...newLog, workers: e.target.value })} />
            <textarea placeholder="¿Qué se hizo hoy? (Avances, problemas, visitas)" className="p-2 border dark:border-slate-600 rounded-lg h-24 bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} />
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><LinkIcon size={14} /> Link a Foto (Google Fotos / Drive)</label>
              <input type="url" placeholder="Pega aquí el enlace de la imagen..." className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 text-sm" value={newLog.image} onChange={e => setNewLog({ ...newLog, image: e.target.value })} />
              {newLog.image && <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-center gap-2"><LinkIcon size={14} /> Enlace adjunto</div>}
            </div>
            <div className="flex gap-2 justify-end mt-2"><Button variant="secondary" onClick={cancelEdit}>Cancelar</Button><Button onClick={handleAddLog}>{editingId ? 'Guardar Cambios' : 'Guardar Registro'}</Button></div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {data.map(log => (
          <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{new Date(log.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{log.weather}</span>
                </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><HardHat size={14} /> {log.workers} operarios</span>
                <button onClick={() => startEdit(log)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={16} /></button>
                <button onClick={() => onUpdate(data.filter(l => l.id !== log.id))} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-3">{log.notes}</p>
            {log.image && (
              <div className="mt-3">
                <a href={log.image} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800/30 transition-colors">
                  <LinkIcon size={16} /> Ver evidencia adjunta
                </a>
              </div>
            )}
          </Card>
        ))}
        {data.length === 0 && <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">No hay registros en la bitácora para esta obra.</div>}
      </div>
    </div>
  );
};

const MaterialsManager = ({ data, onUpdate }) => {
  const [newItem, setNewItem] = useState({ name: '', quantity: '', cost: '', provider: '', category: 'Albañilería' });
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('Todos');
  const categories = ['Albañilería', 'Plomería', 'Electricidad', 'Estructura', 'Pintura', 'Terminaciones', 'Varios'];
  const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  const addItem = () => {
    if (!newItem.name) return;
    if (editingId) {
      onUpdate(data.map(item => item.id === editingId ? { ...item, ...newItem, cost: parseFloat(newItem.cost) || 0 } : item));
      setEditingId(null);
    } else {
      onUpdate([...data, { id: Date.now(), ...newItem, cost: parseFloat(newItem.cost) || 0, status: 'pendiente', date: '-' }]);
    }
    setNewItem({ name: '', quantity: '', cost: '', provider: '', category: 'Albañilería' });
  };

  const startEdit = (item) => {
    setNewItem({ name: item.name, quantity: item.quantity, cost: item.cost, provider: item.provider || '', category: item.category });
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setNewItem({ name: '', quantity: '', cost: '', provider: '', category: 'Albañilería' });
    setEditingId(null);
  };

  const updateStatus = (id, newStatus) => onUpdate(data.map(item => item.id === id ? { ...item, status: newStatus } : item));
  const filteredItems = filterCategory === 'Todos' ? data : data.filter(item => item.category === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Control de Materiales</h2>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select className="p-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white cursor-pointer focus:ring-2 focus:ring-blue-100 outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="Todos">Todos los Rubros</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <Card className="p-4 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
          <input placeholder="Material (ej: Cal)" className="lg:col-span-3 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="Cant." className="lg:col-span-2 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} />
          <div className="lg:col-span-2 relative">
            <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
            <input type="number" placeholder="Costo" className="w-full pl-8 p-2 border dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newItem.cost} onChange={e => setNewItem({ ...newItem, cost: e.target.value })} />
          </div>
          <select className="lg:col-span-2 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <input placeholder="Proveedor..." className="lg:col-span-3 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newItem.provider} onChange={e => setNewItem({ ...newItem, provider: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {editingId && <Button variant="secondary" onClick={cancelEdit}>Cancelar</Button>}
          <Button onClick={addItem} icon={editingId ? Pencil : Plus}>{editingId ? 'Guardar Cambios' : 'Solicitar Material'}</Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {filteredItems.map(item => (
          <Card key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{item.category}</span>
                <Badge status={item.status} />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{item.name}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">📦 {item.quantity}</span>
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300"><DollarSign size={14} /> {formatCurrency(item.cost || 0)}</span>
                {item.provider && <span className="flex items-center gap-1">🏪 {item.provider}</span>}
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
              {item.status === 'pendiente' && <Button variant="secondary" onClick={() => updateStatus(item.id, 'pedido')} className="text-sm">Pedir</Button>}
              {item.status === 'pedido' && <Button variant="success" onClick={() => updateStatus(item.id, 'recibido')} className="text-sm">Recibir</Button>}
              <Button variant="outline" className="text-blue-500 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2" onClick={() => startEdit(item)}><Pencil size={16} /></Button>
              <Button variant="outline" className="text-red-500 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 px-2" onClick={() => onUpdate(data.filter(i => i.id !== item.id))}><Trash2 size={16} /></Button>
            </div>
          </Card>
        ))}
        {filteredItems.length === 0 && <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-slate-400 dark:text-slate-500">{data.length === 0 ? 'No hay materiales en la lista' : `No hay materiales de ${filterCategory}`}</p></div>}
      </div>
    </div>
  );
};

const LaborManager = ({ data, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newProvider, setNewProvider] = useState({ name: '', role: '', totalBudget: '' });
  const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  const addProvider = () => {
    if (!newProvider.name || !newProvider.totalBudget) return;
    if (editingId) {
      onUpdate(data.map(c => c.id === editingId ? { ...c, name: newProvider.name, role: newProvider.role || 'Contratista', totalBudget: parseFloat(newProvider.totalBudget) || 0 } : c));
      setEditingId(null);
    } else {
      onUpdate([...data, { id: Date.now(), name: newProvider.name, role: newProvider.role || 'Contratista', totalBudget: parseFloat(newProvider.totalBudget) || 0, paidAmount: 0, progress: 0, weeklyRequest: 0 }]);
    }
    setNewProvider({ name: '', role: '', totalBudget: '' });
    setIsAdding(false);
  };

  const startEdit = (contractor) => {
    setNewProvider({ name: contractor.name, role: contractor.role, totalBudget: contractor.totalBudget });
    setEditingId(contractor.id);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setNewProvider({ name: '', role: '', totalBudget: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  const updateContractor = (id, field, value) => onUpdate(data.map(c => c.id === id ? { ...c, [field]: value } : c));
  const approvePayment = (id) => {
    const contractor = data.find(c => c.id === id);
    if (!contractor || contractor.weeklyRequest <= 0) return;
    onUpdate(data.map(c => c.id === id ? { ...c, paidAmount: c.paidAmount + c.weeklyRequest, weeklyRequest: 0 } : c));
  };
  const totalWeeklyRequests = data.reduce((acc, curr) => acc + (curr.weeklyRequest || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gestión de Mano de Obra</h2>
        <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><HandCoins size={20} />Total a Pagar Semana: {formatCurrency(totalWeeklyRequests)}</div>
      </div>

      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)} icon={Plus} variant="secondary" className="w-full md:w-auto">Nuevo Proveedor / Contratista</Button>
      ) : (
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/80 border-blue-200 dark:border-blue-900/30 animate-in fade-in">
          <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Alta de Contratista</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input placeholder="Nombre (ej: Juan Pérez)" className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newProvider.name} onChange={e => setNewProvider({ ...newProvider, name: e.target.value })} />
            <input placeholder="Rubro (ej: Electricista)" className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newProvider.role} onChange={e => setNewProvider({ ...newProvider, role: e.target.value })} />
            <input type="number" placeholder="Presupuesto Total ($)" className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newProvider.totalBudget} onChange={e => setNewProvider({ ...newProvider, totalBudget: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><Button onClick={cancelEdit} variant="ghost">Cancelar</Button><Button onClick={addProvider}>{editingId ? 'Guardar Cambios' : 'Guardar'}</Button></div>
        </Card>
      )}

      <div className="grid gap-4">
        {data.map(contractor => {
          const pctPaid = (contractor.paidAmount / contractor.totalBudget) * 100;
          const isOverpaid = pctPaid > (contractor.progress + 5);

          return (
            <Card key={contractor.id} className="p-5 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {contractor.name}
                    <span className="text-xs font-normal bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">{contractor.role}</span>
                    <button onClick={() => startEdit(contractor)} className="ml-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={14} /></button>
                    <button onClick={() => onUpdate(data.filter(c => c.id !== contractor.id))} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={14} /></button>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Presupuesto: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(contractor.totalBudget)}</span></p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:flex-none text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Pagado</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">{formatCurrency(contractor.paidAmount)}</p>
                    <p className={`text-xs ${isOverpaid ? 'text-red-500 dark:text-red-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>({Math.round(pctPaid)}%)</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                  <div className="flex-1 md:flex-none text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Saldo</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">{formatCurrency(contractor.totalBudget - contractor.paidAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Avance de Obra: {contractor.progress}%</label>
                  {isOverpaid && <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded"><AlertTriangle size={12} /> Cuidado: Pagos adelantan avance</span>}
                </div>
                <input type="range" min="0" max="100" className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" value={contractor.progress} onChange={(e) => updateContractor(contractor.id, 'progress', parseInt(e.target.value))} />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex flex-col md:flex-row items-center gap-4 bg-yellow-50/50 dark:bg-yellow-900/10 -mx-5 -mb-5 p-5 mt-2">
                <div className="flex-1 w-full">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-1"><Banknote size={16} className="text-green-600 dark:text-green-400" />Pedido Semanal (Dinero)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input type="number" className="w-full pl-8 p-2 border border-yellow-200 dark:border-yellow-900/30 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Monto a pedir..." value={contractor.weeklyRequest || ''} onChange={(e) => updateContractor(contractor.id, 'weeklyRequest', e.target.value === '' ? 0 : parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="w-full md:w-auto"><Button onClick={() => approvePayment(contractor.id)} disabled={!contractor.weeklyRequest || contractor.weeklyRequest <= 0} variant="success" className="w-full" icon={CheckCircle2}>Aprobar y Registrar Pago</Button></div>
              </div>
            </Card>
          );
        })}
        {data.length === 0 && <div className="text-center py-12 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl"><Users size={48} className="mx-auto mb-3 opacity-20" /><p>No hay proveedores de mano de obra registrados.</p></div>}
      </div>
    </div>
  );
};

const FeesManager = ({ data, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFee, setNewFee] = useState({ name: '', totalBudget: '' });
  const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  const addFee = () => {
    if (!newFee.name || !newFee.totalBudget) return;
    if (editingId) {
      onUpdate(data.map(c => c.id === editingId ? { ...c, name: newFee.name, totalBudget: parseFloat(newFee.totalBudget) || 0 } : c));
      setEditingId(null);
    } else {
      onUpdate([...data, { id: Date.now(), name: newFee.name, totalBudget: parseFloat(newFee.totalBudget) || 0, paidAmount: 0, weeklyRequest: 0 }]);
    }
    setNewFee({ name: '', totalBudget: '' });
    setIsAdding(false);
  };

  const startEdit = (fee) => {
    setNewFee({ name: fee.name, totalBudget: fee.totalBudget });
    setEditingId(fee.id);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setNewFee({ name: '', totalBudget: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  const updateFee = (id, field, value) => onUpdate(data.map(c => c.id === id ? { ...c, [field]: value } : c));
  
  const approvePayment = (id) => {
    const fee = data.find(c => c.id === id);
    if (!fee || fee.weeklyRequest <= 0) return;
    onUpdate(data.map(c => c.id === id ? { ...c, paidAmount: c.paidAmount + c.weeklyRequest, weeklyRequest: 0 } : c));
  };
  
  const totalWeeklyRequests = data.reduce((acc, curr) => acc + (curr.weeklyRequest || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gestión de Honorarios</h2>
        <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Briefcase size={20} />Total Solicitado: {formatCurrency(totalWeeklyRequests)}</div>
      </div>

      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)} icon={Plus} variant="secondary" className="w-full md:w-auto">Nuevo Concepto de Honorarios</Button>
      ) : (
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/80 border-purple-200 dark:border-purple-900/30 animate-in fade-in">
          <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Alta de Honorarios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input placeholder="Concepto (ej: Dirección Técnica)" className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newFee.name} onChange={e => setNewFee({ ...newFee, name: e.target.value })} />
            <input type="number" placeholder="Presupuesto Total ($)" className="p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" value={newFee.totalBudget} onChange={e => setNewFee({ ...newFee, totalBudget: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><Button onClick={cancelEdit} variant="ghost">Cancelar</Button><Button onClick={addFee}>{editingId ? 'Guardar Cambios' : 'Guardar'}</Button></div>
        </Card>
      )}

      <div className="grid gap-4">
        {data.map(fee => {
          const pctPaid = fee.totalBudget > 0 ? (fee.paidAmount / fee.totalBudget) * 100 : 0;

          return (
            <Card key={fee.id} className="p-5 border-l-4 border-l-purple-500 dark:border-l-purple-400">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {fee.name}
                    <button onClick={() => startEdit(fee)} className="ml-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={14} /></button>
                    <button onClick={() => onUpdate(data.filter(f => f.id !== fee.id))} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={14} /></button>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Presupuesto: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(fee.totalBudget)}</span></p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:flex-none text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Pagado</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">{formatCurrency(fee.paidAmount)}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">({Math.round(pctPaid)}%)</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                  <div className="flex-1 md:flex-none text-right">
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Saldo</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">{formatCurrency(fee.totalBudget - fee.paidAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex flex-col md:flex-row items-center gap-4 bg-purple-50/50 dark:bg-purple-900/10 -mx-5 -mb-5 p-5 mt-2">
                <div className="flex-1 w-full">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-1"><Banknote size={16} className="text-purple-600 dark:text-purple-400" />Solicitado para Cobrar</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input type="number" className="w-full pl-8 p-2 border border-purple-200 dark:border-purple-900/30 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 focus:ring-2 focus:ring-purple-400 outline-none" placeholder="Monto a solicitar..." value={fee.weeklyRequest || ''} onChange={(e) => updateFee(fee.id, 'weeklyRequest', e.target.value === '' ? 0 : parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="w-full md:w-auto"><Button onClick={() => approvePayment(fee.id)} disabled={!fee.weeklyRequest || fee.weeklyRequest <= 0} variant="success" className="w-full" icon={CheckCircle2}>Aprobar y Registrar Pago</Button></div>
              </div>
            </Card>
          );
        })}
        {data.length === 0 && <div className="text-center py-12 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl"><Briefcase size={48} className="mx-auto mb-3 opacity-20" /><p>No hay honorarios registrados.</p></div>}
      </div>
    </div>
  );
};

const ProgressTracker = ({ data, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', contractor: '', totalCost: '', paidAmount: '', progress: 0 });
  const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  const updateProgress = (id, val) => onUpdate(data.map(s => s.id === id ? { ...s, progress: parseInt(val) } : s));
  const startAdding = () => { setFormData({ name: '', contractor: '', totalCost: '', paidAmount: '', progress: 0 }); setIsAdding(true); setEditingId(null); };
  const startEditing = (stage) => { setFormData({ ...stage }); setEditingId(stage.id); setIsAdding(false); };
  const cancelEdit = () => { setIsAdding(false); setEditingId(null); };
  const removeStage = (id) => onUpdate(data.filter(s => s.id !== id));

  const saveItem = () => {
    if (!formData.name.trim()) return;
    const itemData = { ...formData, totalCost: parseFloat(formData.totalCost) || 0, paidAmount: parseFloat(formData.paidAmount) || 0, progress: parseInt(formData.progress) || 0 };
    if (editingId) {
      onUpdate(data.map(s => s.id === editingId ? { ...s, ...itemData } : s));
      setEditingId(null);
    } else {
      const newId = data.length > 0 ? Math.max(...data.map(s => s.id)) + 1 : 1;
      onUpdate([...data, { id: newId, ...itemData }]);
      setIsAdding(false);
    }
  };

  const totalProgress = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.progress, 0) / data.length) : 0;
  const totalBudget = data.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalPaid = data.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const financialProgress = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-600 rounded-xl p-4 text-white shadow-md">
          <p className="text-blue-100 text-sm font-medium mb-1">Avance Físico Global</p>
          <div className="flex justify-between items-end"><span className="text-3xl font-bold">{totalProgress}%</span><TrendingUp className="text-blue-200" size={24} /></div>
          <div className="mt-3 h-2 bg-blue-800/30 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${totalProgress}%` }}></div></div>
        </div>
        <div className="bg-emerald-600 rounded-xl p-4 text-white shadow-md">
          <p className="text-emerald-100 text-sm font-medium mb-1">Control Financiero (Pagado)</p>
          <div className="flex justify-between items-end">
            <div className="flex flex-col"><span className="text-3xl font-bold">{financialProgress}%</span><span className="text-xs text-emerald-200">{formatCurrency(totalPaid)} / {formatCurrency(totalBudget)}</span></div>
            <Wallet className="text-emerald-200" size={24} />
          </div>
          <div className="mt-3 h-2 bg-emerald-800/30 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${financialProgress}%` }}></div></div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <h3 className="font-bold text-slate-700 dark:text-slate-100">Desglose por Rubro</h3>
        {!isAdding && !editingId && <Button onClick={startAdding} variant="secondary" icon={Plus}>Nuevo Rubro</Button>}
      </div>

      {(isAdding || editingId) && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/80 border-blue-200 dark:border-blue-900/30 shadow-md animate-in fade-in slide-in-from-top-4">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{isAdding ? 'Agregar Nuevo Rubro' : 'Editar Rubro'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">Rubro / Tarea</label><input className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="Ej: Pintura Exterior" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-slate-500 uppercase">Contratista</label><input className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="Ej: Pintores Hnos." value={formData.contractor} onChange={e => setFormData({ ...formData, contractor: e.target.value })} /></div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Costo Mano de Obra Total</label>
              <div className="relative"><DollarSign size={16} className="absolute left-3 top-3 text-slate-400" /><input type="number" className="w-full pl-8 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="0.00" value={formData.totalCost} onChange={e => setFormData({ ...formData, totalCost: e.target.value })} /></div>
              </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Total Pagado a la Fecha</label>
              <div className="relative"><DollarSign size={16} className="absolute left-3 top-3 text-slate-400" /><input type="number" className="w-full pl-8 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="0.00" value={formData.paidAmount} onChange={e => setFormData({ ...formData, paidAmount: e.target.value })} /></div>
              </div>
          </div>
          <div className="flex justify-end gap-2"><Button onClick={cancelEdit} variant="ghost">Cancelar</Button><Button onClick={saveItem} variant="primary">Guardar Cambios</Button></div>
        </Card>
      )}

      <div className="grid gap-4">
        {data.map(stage => {
          if (editingId === stage.id) return null;
          const pctPaid = stage.totalCost > 0 ? (stage.paidAmount / stage.totalCost) * 100 : 0;
          const isOverpaid = pctPaid > (stage.progress + 5);

          return (
            <div key={stage.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{stage.name}</h4><button onClick={() => startEditing(stage)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={14} /></button></div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><User size={14} /><span>{stage.contractor || 'Sin asignar'}</span></div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-600">
                  <div className="text-right"><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avance Físico</p><p className="font-bold text-blue-600 dark:text-blue-400 text-xl">{stage.progress}%</p></div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-600 mx-2"></div>
                  <div className="text-right"><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avance Financiero</p><p className={`font-bold text-xl ${isOverpaid ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{Math.round(pctPaid)}%</p></div>
                  <button onClick={() => removeStage(stage.id)} className="ml-2 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mb-4"><input type="range" min="0" max="100" className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" value={stage.progress} onChange={(e) => updateProgress(stage.id, e.target.value)} /></div>
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 text-sm flex flex-col sm:flex-row justify-between items-center gap-2 border border-slate-100 dark:border-slate-700">
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="flex flex-col"><span className="text-xs text-slate-400">Presupuesto M.O.</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(stage.totalCost)}</span></div>
                  <div className="flex flex-col"><span className="text-xs text-slate-400">Pagado</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(stage.paidAmount)}</span></div>
                </div>
                {isOverpaid && <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded border border-red-100 dark:border-red-800 w-full sm:w-auto justify-center"><AlertTriangle size={14} /><span>¡Alerta! Pagos superan avance</span></div>}
                {!isOverpaid && pctPaid > 0 && <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800 w-full sm:w-auto justify-center"><CheckCircle2 size={14} /><span>Pagos OK</span></div>}
              </div>
            </div>
          );
        })}
        {data.length === 0 && <div className="text-center py-8 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No hay rubros activos para esta obra.</div>}
      </div>
    </div>
  );
};

const StrategicPlanning = ({ data, onUpdate }) => {
  const [newTask, setNewTask] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('labor');
  const [newAssignee, setNewAssignee] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const addTask = () => {
    if (!newTask) return;
    if (editingId) {
      onUpdate(data.map(t => t.id === editingId ? { ...t, task: newTask, deadline: newDate || 'Sin fecha', type: newType, assignee: newAssignee || 'Sin asignar' } : t));
      setEditingId(null);
    } else {
      onUpdate([...data, { id: Date.now(), task: newTask, deadline: newDate || 'Sin fecha', completed: false, type: newType, assignee: newAssignee || 'Sin asignar', progress: 0 }]);
    }
    setNewTask(''); setNewDate(''); setNewAssignee(''); setNewType('labor');
  };

  const startEdit = (task) => {
    setNewTask(task.task);
    setNewDate(task.deadline === 'Sugerido por IA' || task.deadline === 'Sin fecha' ? '' : task.deadline);
    setNewType(task.type);
    setNewAssignee(task.assignee === 'Sin asignar' || task.assignee === 'Por definir' ? '' : task.assignee);
    setEditingId(task.id);
  };

  const cancelEdit = () => {
    setNewTask(''); setNewDate(''); setNewAssignee(''); setNewType('labor');
    setEditingId(null);
  };

  const generateTasksWithAI = async () => {
    if (!newTask) return;
    setIsGenerating(true);
    const prompt = `Actúa como un planificador de obras experto. El usuario quiere lograr: "${newTask}". Desglosa esto en 3 a 5 tareas específicas y secuenciales para el plan de obra. Devuelve SOLO un JSON array de strings válido, sin markdown. Ejemplo: ["Tarea 1", "Tarea 2"].`;
    try {
      let text = await callGemini(prompt);
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestedTasks = JSON.parse(text);
      if (Array.isArray(suggestedTasks)) {
        const newTasks = suggestedTasks.map((t, index) => ({ id: Date.now() + index, task: t, deadline: 'Sugerido por IA', completed: false, type: 'general', assignee: 'Por definir', progress: 0 }));
        onUpdate([...data, ...newTasks]);
        setNewTask('');
      }
    } catch (e) { console.error("Error parseando respuesta IA", e); }
    setIsGenerating(false);
  };

  const toggleTask = (id) => onUpdate(data.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const updateProgress = (id, value) => onUpdate(data.map(t => t.id === id ? { ...t, progress: parseInt(value) } : t));
  const getTypeIcon = (type) => { switch (type) { case 'material': return <Truck size={14} />; case 'labor': return <HardHat size={14} />; case 'manage': return <FileText size={14} />; default: return <ClipboardList size={14} />; } };
  const getTypeLabel = (type) => { switch (type) { case 'material': return 'Material'; case 'labor': return 'Mano de Obra'; case 'manage': return 'Gestión'; default: return 'General'; } };
  const getTypeColor = (type) => { switch (type) { case 'material': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'; case 'labor': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'; case 'manage': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'; default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'; } };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      <div><h3 className="font-bold text-slate-700 dark:text-slate-100">Tablero de Tareas y Objetivos</h3><p className="text-xs text-slate-500 dark:text-slate-400">Define la estrategia y tareas futuras</p></div>

      <Card className="p-4 bg-slate-50 dark:bg-slate-800/80 space-y-4">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block">Nuevo Objetivo o Tarea:</label>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input className="md:col-span-6 p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="Ej: Construir quincho en el fondo..." value={newTask} onChange={e => setNewTask(e.target.value)} />
          <select className="md:col-span-3 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" value={newType} onChange={e => setNewType(e.target.value)}><option value="labor">👷 Mano de Obra</option><option value="material">🚛 Material</option><option value="manage">📋 Gestión</option></select>
          <input type="date" className="md:col-span-3 p-2 border dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 dark:[color-scheme:dark]" value={newDate} onChange={e => setNewDate(e.target.value)} />
          <input className="md:col-span-12 p-2 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" placeholder="Responsable o Proveedor (Ej: Juan Pérez, Corralón Norte...)" value={newAssignee} onChange={e => setNewAssignee(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/50 dark:border-slate-700">
          {editingId && <Button variant="secondary" onClick={cancelEdit}>Cancelar</Button>}
          {!editingId && <Button variant="magic" onClick={generateTasksWithAI} disabled={!newTask || isGenerating} icon={isGenerating ? Loader2 : Sparkles} className={isGenerating ? "animate-pulse" : ""}>{isGenerating ? 'Generando...' : 'Sugerir Etapas IA'}</Button>}
          <Button onClick={addTask} icon={editingId ? Pencil : Plus}>{editingId ? 'Guardar Cambios' : 'Agregar Manual'}</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {data.map(task => (
          <div key={task.id} className={`flex flex-col sm:flex-row sm:items-center p-3 rounded-lg border transition-all gap-3 ${task.completed ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center flex-1 gap-3">
              <button onClick={() => toggleTask(task.id)} className={`rounded-full p-1 transition-colors ${task.completed ? 'text-green-500 dark:text-green-400' : 'text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400'}`}><CheckCircle2 size={24} className={task.completed ? 'fill-green-100 dark:fill-green-900/30' : ''} /></button>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getTypeColor(task.type)}`}>{getTypeIcon(task.type)} {getTypeLabel(task.type)}</span>
                  {task.assignee && <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded"><User size={10} /> {task.assignee}</span>}
                </div>
                <p className={`font-medium ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{task.task}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><CalendarDays size={12} />{task.deadline === 'Sugerido por IA' ? <span className="text-indigo-500 dark:text-indigo-400 font-medium flex items-center gap-1"><Sparkles size={10} /> Sugerido IA</span> : `Vence: ${task.deadline}`}</p>
                <div className="mt-2 flex items-center gap-2 max-w-md"><input type="range" min="0" max="100" className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" value={task.progress || 0} onChange={(e) => updateProgress(task.id, e.target.value)} onClick={(e) => e.stopPropagation()} /><span className="text-xs text-slate-500 dark:text-slate-400 font-medium w-8 text-right">{task.progress || 0}%</span></div>
              </div>
            </div>
            <div className="flex justify-end sm:self-center gap-2">
              <Button variant="outline" className="text-blue-500 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2" onClick={() => startEdit(task)}><Pencil size={16} /></Button>
              <Button variant="outline" className="text-red-500 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 px-2" onClick={() => onUpdate(data.filter(t => t.id !== task.id))}><Trash2 size={16} /></Button>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="text-center py-8 text-slate-400 dark:text-slate-500"><p>No hay tareas planificadas.</p><p className="text-sm">¡Prueba escribir un objetivo y usar el botón mágico ✨!</p></div>}
      </div>
    </div>
  );
};

const GanttViewer = ({ file, onUpdate }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { alert("El archivo es demasiado grande (Max 1MB). Por favor, optimice el PDF."); return; }
      const reader = new FileReader();
      reader.onloadend = () => { onUpdate(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div><h3 className="font-bold text-slate-700 dark:text-slate-100">Plan de Avance General</h3><p className="text-xs text-slate-500 dark:text-slate-400">Visualización del cronograma maestro (Gantt)</p></div>
         <div className="relative">
            <input type="file" accept="application/pdf" className="hidden" id="gantt-upload" onChange={handleFileChange} />
            <label htmlFor="gantt-upload" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm font-medium shadow-sm active:scale-95 duration-200"><FileBarChart size={16} />{file ? 'Actualizar Plan PDF' : 'Cargar Plan PDF'}</label>
         </div>
       </div>
       <Card className="h-[600px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 border-dashed border-2 border-slate-300 dark:border-slate-700 p-1">
         {file ? (<iframe src={file} className="w-full h-full rounded-lg bg-white" title="Plan de Avance"></iframe>) : (<div className="text-center text-slate-400 dark:text-slate-600"><FileBarChart size={64} className="mx-auto mb-4 opacity-50" /><p className="font-medium text-lg">No hay un plan de avance cargado</p><p className="text-sm mt-1">Sube un archivo PDF para visualizarlo aquí</p></div>)}
       </Card>
    </div>
  );
};

const IntegratedPlanning = ({ projectData, updateProjectData }) => {
  const [subTab, setSubTab] = useState('gantt');
  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit overflow-x-auto max-w-full">
        <button onClick={() => setSubTab('gantt')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${subTab === 'gantt' ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><FileBarChart size={16} />Plan de Avance</button>
        <button onClick={() => setSubTab('board')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${subTab === 'board' ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><LayoutDashboard size={16} />Estrategia y Tareas</button>
        <button onClick={() => setSubTab('log')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${subTab === 'log' ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><ClipboardList size={16} />Bitácora Diaria</button>
      </div>
      <div className="min-h-[400px]">
        {subTab === 'gantt' && <GanttViewer file={projectData.ganttFile} onUpdate={(newFile) => updateProjectData('ganttFile', newFile)} />}
        {subTab === 'board' && <StrategicPlanning data={projectData.tasks || []} onUpdate={(newData) => updateProjectData('tasks', newData)} />}
        {subTab === 'log' && <DailyLog data={projectData.logs || []} onUpdate={(newData) => updateProjectData('logs', newData)} />}
      </div>
    </div>
  );
};

const WeeklyReport = ({ data }) => {
  const pendingMaterials = (data.materials || []).filter(m => m.status === 'pendiente' || m.status === 'pedido');
  const totalBudget = (data.stages || []).reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalPaid = (data.stages || []).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalLaborWeeklyRequest = (data.labor || []).reduce((acc, curr) => acc + (curr.weeklyRequest || 0), 0);
  const totalLaborBudget = (data.labor || []).reduce((acc, curr) => acc + (curr.totalBudget || 0), 0);
  const totalLaborPaid = (data.labor || []).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalPendingMaterialsCost = pendingMaterials.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalFeesWeeklyRequest = (data.fees || []).reduce((acc, curr) => acc + (curr.weeklyRequest || 0), 0);

  const totalWeeklyPayment = totalLaborWeeklyRequest + totalPendingMaterialsCost + totalFeesWeeklyRequest;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
   
  const weeklyLogs = (data.logs || []).filter(log => {
    const logDate = new Date(log.date + 'T00:00:00');
    return logDate >= sevenDaysAgo;
  });

  const weeklyPhotos = weeklyLogs.filter(log => log.image);
  const formatCurrency = (amount) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6 print:space-y-4 print:block print:w-full">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Informe Semanal</h2>
        <Button icon={Printer} variant="outline" onClick={() => window.print()}>Imprimir</Button>
      </div>

      <div className="hidden print:block border-b-2 border-slate-800 pb-2 mb-6">
        <h1 className="text-3xl font-bold text-black">{data.name || 'Proyecto de Obra'}</h1>
        <p className="text-slate-600 mt-1">Informe de Estado Semanal - Generado el {new Date().toLocaleDateString('es-AR')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
        <Card className="p-6 print:shadow-none print:border-slate-300">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users size={20} /> Estado Mano de Obra
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <div><p className="text-sm text-slate-500 dark:text-slate-400">Presupuesto Total MO</p><p className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(totalLaborBudget)}</p></div>
              <div className="text-right"><p className="text-sm text-slate-500 dark:text-slate-400">Pagado Total</p><p className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalLaborPaid)}</p></div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${totalLaborBudget > 0 ? (totalLaborPaid / totalLaborBudget) * 100 : 0}%` }}></div>
            </div>
            <div className="mt-4 space-y-2">
              {(data.labor || []).map(l => (
                <div key={l.id} className="flex justify-between text-sm border-b border-slate-50 dark:border-slate-700 pb-2 last:border-0 text-slate-700 dark:text-slate-300 print:border-slate-200">
                  <span>{l.name}</span>
                  <div className="flex gap-3">
                    {l.weeklyRequest > 0 && <span className="text-yellow-600 dark:text-yellow-500 font-bold">Pide: {formatCurrency(l.weeklyRequest)}</span>}
                    <span className="text-slate-500 dark:text-slate-400">{l.totalBudget > 0 ? Math.round((l.paidAmount / l.totalBudget) * 100) : 0}% Pagado</span>
                  </div>
                </div>
              ))}
              </div>
          </div>
        </Card>

        <Card className="p-6 print:shadow-none print:border-slate-300">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Truck size={20} /> Compras Pendientes
          </h3>
          {pendingMaterials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 print:bg-slate-100">
                  <tr><th className="px-2 py-2">Item</th><th className="px-2 py-2">Cant</th><th className="px-2 py-2 text-right">Costo Est.</th></tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                  {pendingMaterials.map(m => (
                    <tr key={m.id} className="border-b border-slate-50 dark:border-slate-700 last:border-0 print:border-slate-200">
                      <td className="px-2 py-2 font-medium">{m.name}</td>
                      <td className="px-2 py-2 text-slate-500 dark:text-slate-400">{m.quantity}</td>
                      <td className="px-2 py-2 text-right font-medium">{formatCurrency(m.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">No hay materiales pendientes.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-4 print:break-inside-avoid">
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30 print:bg-white print:border-slate-300 print:shadow-none">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2"><HandCoins size={16} /> Mano Obra</h3>
          <p className="text-xl md:text-2xl font-bold text-yellow-700 dark:text-yellow-500 print:text-black">{formatCurrency(totalLaborWeeklyRequest)}</p>
        </Card>
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 print:bg-white print:border-slate-300 print:shadow-none">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2"><Truck size={16} /> Materiales</h3>
          <p className="text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-500 print:text-black">{formatCurrency(totalPendingMaterialsCost)}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1 print:text-slate-600">{pendingMaterials.length} items pend.</p>
        </Card>
        <Card className="p-4 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30 print:bg-white print:border-slate-300 print:shadow-none">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2"><Briefcase size={16} /> Honorarios</h3>
          <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-500 print:text-black">{formatCurrency(totalFeesWeeklyRequest)}</p>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 print:bg-white print:border-slate-300 print:shadow-none">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2"><Wallet size={16} /> Total a Pagar</h3>
          <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-500 print:text-black">{formatCurrency(totalWeeklyPayment)}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 print:text-slate-600">Mat + M.O. + Hon.</p>
        </Card>
      </div>

      {weeklyPhotos.length > 0 && (
        <Card className="p-6 print:shadow-none print:border-slate-300 print:break-inside-avoid">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LinkIcon size={20} /> Enlaces Fotográficos de la Semana
          </h3>
          <div className="space-y-2">
            {weeklyPhotos.map(log => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 print:border-slate-300 print:bg-white">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 print:text-black">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString()} - {log.notes.substring(0, 40)}...
                </span>
                <a href={log.image} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 print:text-blue-800 font-medium whitespace-nowrap">
                  <LinkIcon size={14} /> Abrir Enlace
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 print:shadow-none print:border-slate-300 print:break-inside-auto">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Resumen Ejecutivo</h3>
        <div className="space-y-4 text-slate-600 dark:text-slate-300 print:text-black">
          <p>Esta semana se han registrado <strong>{weeklyLogs.length} entradas</strong> en la bitácora de obra. El avance financiero global se encuentra al <strong>{Math.round(totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0)}%</strong>.</p>
          <div className="space-y-2 mt-4 print:space-y-4">
            {weeklyLogs.length > 0 ? (
                weeklyLogs.map(log => (
                    <div key={log.id} className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700 print:bg-white print:border-slate-300 print:break-inside-avoid">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200 print:text-black">{new Date(log.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}</span>
                            <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 print:bg-slate-100 print:text-black print:border print:border-slate-300">{log.weather}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 print:text-black">{log.notes}</p>
                    </div>
                ))
            ) : (<p className="text-sm text-slate-400 italic">No hay registros de bitácora esta semana.</p>)}
          </div>

          <div className="mt-4 print:break-inside-avoid">
             <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-2 print:text-black">Estado de Tareas Estratégicas</h4>
             {(data.tasks || []).length > 0 ? (
               <div className="space-y-2">
                 {(data.tasks || []).map(task => (
                   <div key={task.id} className="flex flex-col gap-1 text-sm border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0 print:border-slate-300">
                     <div className="flex justify-between items-center">
                       <span className={`${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300 print:text-black'}`}>{task.task}</span>
                       <span className="font-bold text-xs">{task.completed ? '100%' : `${task.progress || 0}%`}</span>
                     </div>
                     {!task.completed && (
                       <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 print:bg-slate-200"><div className="bg-blue-500 h-1.5 rounded-full print:bg-slate-600" style={{ width: `${task.progress || 0}%` }}></div></div>
                     )}
                   </div>
                 ))}
               </div>
             ) : (<p className="text-sm text-slate-400 italic">No hay tareas estratégicas registradas.</p>)}
          </div>

          {(data.tasks || []).filter(t => !t.completed && t.type === 'manage').length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-2 mt-4 print:break-inside-avoid print:border-slate-300 print:bg-white print:text-black">
              <AlertTriangle className="mt-0.5 print:text-slate-600" size={16} />
              <div><p className="font-bold text-sm">Atención Requerida</p><p className="text-sm">Hay tareas de gestión pendientes que podrían bloquear avances.</p></div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// --- App Principal ---

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('obraControl_darkMode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('obraControl_darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('obraControl_darkMode', 'false');
    }
  }, [darkMode]);

  const [activeTab, setActiveTab] = useState('planificacion');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
   
  const [user, setUser] = useState(null);
  
  // CORRECCIÓN: Inicialización de clave y datos 100% atada a LocalStorage
  const [projectKey, setProjectKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('obraControl_projectKey') || `OBRA-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return 'OBRA-1234';
  });
  
  const [syncStatus, setSyncStatus] = useState('offline');
  const [inputKey, setInputKey] = useState('');

  const [allData, setAllData] = useState(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('obraControl_projectKey') || projectKey;
      const localData = localStorage.getItem(`obraControl_data_${key}`);
      if (localData) return JSON.parse(localData);
    }
    return INITIAL_DB;
  });
  
  const [activeProjectId, setActiveProjectId] = useState(() => {
    if (typeof window !== 'undefined') {
       const lastId = localStorage.getItem('obraControl_activeProject');
       return lastId ? Number(lastId) : 1;
    }
    return 1;
  });
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  // --- NUEVAS FUNCIONES DE EXPORTAR / IMPORTAR ---
  const handleExportData = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `obracontrol_respaldo_${projectKey}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && typeof importedData === 'object' && Object.keys(importedData).length > 0) {
          setAllData(importedData);
          localStorage.setItem(`obraControl_data_${projectKey}`, JSON.stringify(importedData));
          
          // Intentar subir a la nube si está conectado
          if (syncStatus === 'synced' || syncStatus === 'syncing') {
             saveToCloud(importedData);
          }
          
          alert("✅ ¡Datos importados correctamente!");
          setShowSyncModal(false);
        } else {
          alert("El archivo no tiene el formato correcto.");
        }
      } catch (err) {
        alert("🚨 Error al leer el archivo. Asegúrate de que sea un respaldo válido (.json).");
      }
    };
    reader.readAsText(file);
    // Limpiar el input para permitir cargar el mismo archivo dos veces si se necesita
    e.target.value = null; 
  };
  // -----------------------------------------------

  const projects = Object.entries(allData).map(([id, data]) => ({
    id: Number(id),
    name: data.name || `Obra ${id}`,
    progress: data.progress || 0,
    status: data.status || 'active',
    budget: data.budget || 0
  }));

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const projectData = allData[activeProjectId] || INITIAL_DB[1];

  // 1. Iniciar Sesión en Firebase (Necesario para escribir en Firestore)
  useEffect(() => {
    if (!auth) {
      setSyncStatus('offline');
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth); // Requiere Auth Anónimo habilitado en Firebase
        }
      } catch (error) {
        console.error("🚨 Error Auth Firebase: Asegúrate de habilitar 'Anónimo' en Firebase Console > Authentication", error);
        setSyncStatus('error');
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Suscribirse a cambios en Firestore y guardar copia local
  useEffect(() => {
    if (!user || !db) return;
    localStorage.setItem('obraControl_projectKey', projectKey);
    setSyncStatus('syncing');
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectKey);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.fullData) {
          setAllData(data.fullData);
          localStorage.setItem(`obraControl_data_${projectKey}`, JSON.stringify(data.fullData));
          setSyncStatus('synced');
        }
      } else {
        // Documento no existe en la nube aún, subir los datos locales de esta PC
        setDoc(docRef, { fullData: allData }, { merge: true })
          .then(() => setSyncStatus('synced'))
          .catch((e) => {
            console.error("Error al crear documento base en Firebase:", e);
            setSyncStatus('error');
          });
      }
    }, (error) => {
      console.error("🚨 Error Firestore: Tus Reglas de Seguridad (Rules) están bloqueando la conexión.", error);
      setSyncStatus('error');
    });
    
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectKey]);

  // 3. Función Guardar: Siempre local, intenta Nube si hay conexión
  const saveToCloud = async (newData) => {
    setAllData(newData);
    localStorage.setItem(`obraControl_data_${projectKey}`, JSON.stringify(newData));
    
    if (!user || !db) {
      console.warn("⚠️ No se puede guardar en Firebase. Guardado localmente.");
      setSyncStatus('offline');
      return;
    }
    
    try {
      setSyncStatus('syncing');
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectKey);
      await setDoc(docRef, { fullData: newData }, { merge: true });
      setSyncStatus('synced');
    } catch (e) {
      console.error("🚨 Error guardando en Firebase (Faltan permisos):", e);
      setSyncStatus('error');
    }
  };

  const updateProjectData = (section, newData) => {
    const updatedAllData = {
      ...allData,
      [activeProjectId]: {
        ...allData[activeProjectId],
        [section]: newData
      }
    };
    saveToCloud(updatedAllData);
  };

  const updateProjectDetails = (id, newName, newBudget) => {
    const updatedAllData = {
      ...allData,
      [id]: { ...allData[id], name: newName, budget: parseFloat(newBudget) }
    };
    saveToCloud(updatedAllData);
    setIsEditingProject(false);
  };

  const switchProject = (id) => {
    setActiveProjectId(id);
    localStorage.setItem('obraControl_activeProject', id);
    setShowProjectMenu(false);
  };

  const deleteProject = (id, e) => {
    e.stopPropagation();
    if(!confirm('¿Estás seguro de eliminar esta obra y todos sus datos?')) return;
    const updatedAllData = { ...allData };
    delete updatedAllData[id];
    
    if (Object.keys(updatedAllData).length === 0) {
      const newId = Date.now();
      updatedAllData[newId] = { name: 'Nueva Obra', status: 'active', budget: 0, progress: 0, logs: [], materials: [], stages: [], tasks: [], labor: [], fees: [] };
    }
    
    saveToCloud(updatedAllData);
    
    if (activeProjectId === id) {
      const firstAvailableId = Number(Object.keys(updatedAllData)[0]);
      setActiveProjectId(firstAvailableId);
      localStorage.setItem('obraControl_activeProject', firstAvailableId);
    }
  };

  const startEditProject = (id, e) => {
    e.stopPropagation();
    switchProject(id);
    setIsEditingProject(true);
  };

  const createNewProject = (name, budget) => {
    if (name) {
      const newId = Date.now();
      const updatedAllData = {
        ...allData,
        [newId]: { 
          name, status: 'active', budget: parseFloat(budget) || 0, progress: 0, 
          logs: [], materials: [], stages: [], tasks: [], labor: [], fees: []
        }
      };
      saveToCloud(updatedAllData);
      setActiveProjectId(newId);
      setShowProjectMenu(false);
      setIsCreatingProject(false);
    }
  };

  const changeProjectKey = () => {
    if (inputKey && inputKey.length > 3) {
      if (confirm(`Vamos a vincularte al código ${inputKey}. ¿Estás seguro?`)) {
        setProjectKey(inputKey);
        // Cargar inmediatamente de memoria local si existía antes
        const localData = localStorage.getItem(`obraControl_data_${inputKey}`);
        if (localData) setAllData(JSON.parse(localData));
        setShowSyncModal(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
  };

  const navItems = [
    { id: 'planificacion', label: 'Planificación', icon: CalendarDays },
    { id: 'honorarios', label: 'Honorarios', icon: Briefcase },
    { id: 'mano_obra', label: 'Mano de Obra', icon: Users },
    { id: 'materiales', label: 'Materiales', icon: Truck },
    { id: 'informes', label: 'Informes', icon: FileText },
  ];

  const totalSpent = ((projectData.labor || []).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0)) + 
                     ((projectData.materials || []).filter(m => m.status === 'recibido').reduce((acc, curr) => acc + (curr.cost || 0), 0)) +
                     ((projectData.stages || []).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0)) +
                     ((projectData.fees || []).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0));
   
  const remainingBudget = (activeProject.budget || 0) - totalSpent;

  return (
    <div className="print:bg-white">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex transition-colors duration-300 print:block print:bg-white print:text-black">
        
        {showSyncModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <Card className="w-full max-w-sm p-6 bg-white dark:bg-slate-800 animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CloudCog size={20} className="text-blue-600"/> Sincronización
                  </h3>
                </div>
                <button onClick={() => setShowSyncModal(false)}><X size={20} className="text-slate-400" /></button>
              </div>
              
              <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-xl border border-blue-100 dark:border-slate-600 mb-4 text-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tu Código de Obra</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-mono font-bold text-blue-700 dark:text-blue-300 tracking-widest">{projectKey}</span>
                  <button onClick={() => {navigator.clipboard.writeText(projectKey);}} className="p-2 hover:bg-blue-100 dark:hover:bg-slate-600 rounded-lg text-blue-600 dark:text-blue-400" title="Copiar código"><Copy size={18} /></button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <SyncIndicator status={syncStatus} />
                  {syncStatus === 'synced' ? '¡Nube conectada!' : syncStatus === 'error' ? 'Fallo en la nube' : 'Modo local activo'}
                </div>
              </div>

              {/* NUEVA SECCIÓN: IMPORTAR / EXPORTAR MANUALMENTE */}
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <FileText size={16} /> Respaldo Manual (Sin Nube)
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-3">
                  Si la nube falla, puedes descargar tu proyecto y pasarlo a otro dispositivo (por Google Drive, WhatsApp o Mail) y cargarlo allí.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs py-1.5" onClick={handleExportData}>
                    Exportar
                  </Button>
                  <div className="flex-1 relative">
                    <input type="file" accept=".json" id="import-file" className="hidden" onChange={handleImportData} />
                    <label htmlFor="import-file" className="flex items-center justify-center w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs py-1.5 font-medium cursor-pointer transition-colors text-center h-full">
                      Importar
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <p>💡 <strong>¿Quieres usar otro dispositivo?</strong> Abre la web en tu celular, entra a Sincronizar, y pega el código de arriba para cargar tus datos.</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Cambiar a otro código existente:</label>
                <div className="flex gap-2">
                  <input className="flex-1 p-2 border dark:border-slate-600 rounded-lg uppercase font-mono text-center bg-white dark:bg-slate-700 dark:text-white" placeholder="Ej: OBRA-1234" value={inputKey} onChange={(e) => setInputKey(e.target.value.toUpperCase())} />
                  <Button onClick={changeProjectKey} disabled={inputKey.length < 4} variant="primary">Cargar</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
              <div className="bg-blue-600 text-white p-2 rounded-lg"><Hammer size={24} /></div>
              <div><h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">ObraControl</h1><p className="text-xs text-slate-500 dark:text-slate-400">Gestión Inteligente</p></div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}>
                  <Icon size={20} className={activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                  {item.label}
                </button>
              );
            })}
            <button onClick={() => { setShowSyncModal(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 mt-4"><CloudCog size={20} />Sincronizar</button>
          </nav>
          <div className="p-4 border-t border-slate-100 dark:border-slate-700"><button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">{darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-slate-400" />}{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</button></div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {showProjectMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
                <div className="p-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 text-sm flex justify-between items-center"><span>Mis Obras</span><button onClick={() => setShowProjectMenu(false)}><X size={16} /></button></div>
                <div className="max-h-60 overflow-y-auto">
                  {projects.map(p => (
                    <div key={p.id} className={`w-full flex items-center justify-between p-2 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${activeProjectId === p.id ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                      <button onClick={() => switchProject(p.id)} className="flex items-center gap-2 flex-1 truncate text-left px-1">
                        <Building size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </button>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={(e) => startEditProject(p.id, e)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"><Pencil size={14} /></button>
                        <button onClick={(e) => deleteProject(p.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-700"><button onClick={() => setIsCreatingProject(true)} className="w-full py-2 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg"><Plus size={16} /> Nueva Obra</button></div>
              </div>
            )}
            <div onClick={() => setShowProjectMenu(!showProjectMenu)} className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 text-white cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors group relative"><div className="flex justify-between items-start mb-1"><p className="text-xs text-slate-400">Proyecto Activo</p><ArrowRightLeft size={14} className="text-slate-500 group-hover:text-white transition-colors" /></div><p className="font-bold truncate pr-4">{activeProject.name}</p></div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:block relative">
          
          {/* Barra Inferior Móvil (Reemplaza al header superior) */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between z-20 print:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm flex-shrink-0"><Hammer size={20} /></div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-slate-800 dark:text-white truncate leading-tight">{activeProject.name}</span>
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">{projectKey} <SyncIndicator status={syncStatus} /></span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(true)} className="p-3 text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 flex-shrink-0">
              <Menu size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 pb-24 md:p-8 max-w-5xl mx-auto w-full print:overflow-visible print:h-auto print:p-0 print:m-0 print:max-w-none print:block">
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 print:hidden">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1" onClick={() => setIsEditingProject(true)}>
                      <Building size={14} /><span className="font-medium">{activeProject.name}</span><Pencil size={12} />
                    </span>
                    <span className="hidden md:block mx-2 border-l border-slate-300 dark:border-slate-600 h-4"></span>
                    <span className="hidden md:flex cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded font-mono text-[10px] items-center gap-1.5" onClick={() => setShowSyncModal(true)} title="Estado de sincronización">
                      {projectKey} <SyncIndicator status={syncStatus} />
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{navItems.find(i => i.id === activeTab)?.label}</h2>
                </div>
                <div className="hidden sm:block text-right"><Badge status={activeProject.status} /></div>
              </div>
              
              {syncStatus === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-sm print:hidden">
                  <AlertTriangle className="mt-0.5 flex-shrink-0" size={16} />
                  <div>
                    <p className="font-bold">Error conectando con la base de datos (Firebase)</p>
                    <p>Tus datos se guardan en esta PC, pero para compartirlos debes habilitar el acceso "Anónimo" en Firebase Authentication y verificar tus Reglas de Firestore.</p>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group print:shadow-none print:border-slate-300 print:break-inside-avoid">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 print:hidden"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1 print:text-slate-600"><Target size={14} /> Presupuesto Total</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 print:text-black">{formatCurrency(activeProject.budget || 0)}</p></div>
                  <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1 print:text-slate-600"><Coins size={14} /> Ejecutado</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 print:text-black">{formatCurrency(totalSpent)}</p></div>
                  <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1 print:text-slate-600"><Wallet size={14} /> Disponible</p><p className={`text-2xl font-bold mt-1 ${remainingBudget < 0 ? 'text-red-500 print:text-red-700' : 'text-emerald-600 print:text-emerald-700'}`}>{formatCurrency(remainingBudget)}</p></div>
                </div>

                <div className="relative z-10 mt-4">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden print:border print:border-slate-300 print:bg-white">
                    <div 
                      className={`h-full ${remainingBudget < 0 ? 'bg-red-500' : 'bg-blue-600 dark:bg-blue-500'} transition-all duration-1000 ease-out print:bg-slate-400`} 
                      style={{ width: `${Math.min(100, (totalSpent / (activeProject.budget || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase print:text-slate-600">0%</span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase print:text-slate-600">{Math.round((totalSpent / (activeProject.budget || 1)) * 100)}% Ejecutado</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase print:text-slate-600">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Crear Nueva Obra */}
            {isCreatingProject && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-800 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Cargar Nueva Obra</h3>
                    <button onClick={() => setIsCreatingProject(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    createNewProject(e.target.name.value, e.target.budget.value); 
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de la Obra</label>
                        <input name="name" required placeholder="Ej: Casa Rivas" className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presupuesto Inicial ($)</label>
                        <input name="budget" type="number" placeholder="0" className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" />
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setIsCreatingProject(false)}>Cancelar</Button>
                        <Button type="submit">Crear Obra</Button>
                      </div>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            {isEditingProject && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-800 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Editar Proyecto</h3><button onClick={() => setIsEditingProject(false)}><X size={20} className="text-slate-400" /></button></div>
                  <form onSubmit={(e) => { e.preventDefault(); updateProjectDetails(activeProject.id, e.target.name.value, e.target.budget.value); }}>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label><input name="name" defaultValue={activeProject.name} className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Presupuesto ($)</label><input name="budget" type="number" defaultValue={activeProject.budget} className="w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white" /></div>
                      <div className="pt-2 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setIsEditingProject(false)}>Cancelar</Button><Button type="submit">Guardar</Button></div>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            <div key={`${activeTab}-${activeProjectId}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'planificacion' && <IntegratedPlanning projectData={projectData} updateProjectData={updateProjectData} />}
              {activeTab === 'honorarios' && <FeesManager data={projectData.fees || []} onUpdate={(newData) => updateProjectData('fees', newData)} />}
              {activeTab === 'mano_obra' && <LaborManager data={projectData.labor || []} onUpdate={(newData) => updateProjectData('labor', newData)} />}
              {activeTab === 'materiales' && <MaterialsManager data={projectData.materials || []} onUpdate={(newData) => updateProjectData('materials', newData)} />}
              {activeTab === 'informes' && <WeeklyReport data={projectData} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
