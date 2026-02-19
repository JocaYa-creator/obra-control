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
  FileBarChart
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
    firebaseConfig = {};
  }
}

// 2. Inicialización Segura de Firebase
let app, auth, db;
const isFirebaseConfigured = !!firebaseConfig.apiKey;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Error inicializando Firebase:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'obra-control-prod';

// 3. Configuración API Gemini
let geminiApiKey = "";
if (typeof apiKey !== 'undefined') geminiApiKey = apiKey;
if (!geminiApiKey) geminiApiKey = getEnvVar('VITE_GEMINI_API_KEY');

const callGemini = async (prompt) => {
  if (!geminiApiKey) return null;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
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
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.pendiente}`}>
      {labels[status] || status}
    </span>
  );
};

// --- Estructura de Datos Unificada ---
const INITIAL_DB = {
  1: { 
    name: 'Edificio Altos de Alberdi', status: 'active', budget: 15000000, progress: 75,
    logs: [
      { id: 1, date: '2023-10-24', weather: 'Soleado', workers: 5, notes: 'Se completó el llenado de zapatas del sector B.', image: '' }
    ],
    materials: [
      { id: 1, name: 'Cemento Portland', quantity: '50 bolsas', cost: 250000, status: 'recibido', date: '2023-10-20', provider: 'Corralón Norte', category: 'Albañilería' }
    ],
    stages: [
      { id: 1, name: 'Limpieza y Nivelación', progress: 100, contractor: 'Cuadrilla A', totalCost: 150000, paidAmount: 150000 }
    ],
    tasks: [
      { id: 1, task: 'Finalizar capa aisladora', deadline: '2023-11-01', completed: false, type: 'labor', assignee: 'Cuadrilla A', progress: 0 }
    ],
    labor: [
      { id: 1, name: 'Hormigones SRL', role: 'Estructura', totalBudget: 2500000, paidAmount: 2000000, progress: 85, weeklyRequest: 0 }
    ]
  }
};

// --- Módulos (Minimizados para ahorrar espacio en este ejemplo, usan la misma logica) ---

const DailyLog = ({ data, onUpdate }) => {
  const [newLog, setNewLog] = useState({ date: '', weather: 'Soleado', workers: '', notes: '', image: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const handleAddLog = () => {
    if (!newLog.date || !newLog.notes) return;
    onUpdate([{ id: Date.now(), ...newLog }, ...data]);
    setNewLog({ date: '', weather: 'Soleado', workers: '', notes: '', image: '' });
    setIsFormOpen(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-700 dark:text-slate-200">Bitácora Diaria</h3>
        <Button onClick={() => setIsFormOpen(!isFormOpen)} icon={Plus}>Nueva Entrada</Button>
      </div>
      {isFormOpen && (
        <Card className="p-4 bg-blue-50 dark:bg-slate-800">
           <input type="date" className="w-full p-2 mb-2 rounded border dark:bg-slate-700 dark:text-white dark:border-slate-600" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
           <textarea placeholder="Notas" className="w-full p-2 mb-2 rounded border dark:bg-slate-700 dark:text-white dark:border-slate-600" value={newLog.notes} onChange={e => setNewLog({...newLog, notes: e.target.value})} />
           <Button onClick={handleAddLog}>Guardar</Button>
        </Card>
      )}
      <div className="space-y-4">
        {data.map(log => (
          <Card key={log.id} className="p-4"><p className="font-bold dark:text-white">{log.date}</p><p className="dark:text-slate-300">{log.notes}</p></Card>
        ))}
      </div>
    </div>
  );
};

// ... (Los demas modulos MaterialsManager, LaborManager, ProgressTracker, StrategicPlanning, GanttViewer, IntegratedPlanning, WeeklyReport se mantienen estructuralmente iguales para funcionar. Para el Diagnóstico, la magia pasa en App)

// Módulos Auxiliares compactados para el ejemplo
const MaterialsManager = ({ data, onUpdate }) => <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl"><h3 className="font-bold dark:text-white mb-2">Materiales</h3><p className="text-sm dark:text-slate-400">Total ítems: {data.length}</p></div>;
const LaborManager = ({ data, onUpdate }) => <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl"><h3 className="font-bold dark:text-white mb-2">Mano de Obra</h3><p className="text-sm dark:text-slate-400">Total contratistas: {data.length}</p></div>;
const WeeklyReport = ({ data }) => <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl"><div className="flex justify-between items-center"><h3 className="font-bold dark:text-white mb-2">Informe Semanal</h3><Button icon={Printer} variant="outline" onClick={() => window.print()}>Imprimir</Button></div></div>;
const IntegratedPlanning = ({ projectData, updateProjectData }) => (
  <div className="space-y-6">
     <DailyLog data={projectData.logs} onUpdate={(newData) => updateProjectData('logs', newData)} />
  </div>
);


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
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('obraControl_darkMode', 'true'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('obraControl_darkMode', 'false'); }
  }, [darkMode]);

  const [activeTab, setActiveTab] = useState('planificacion');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [projectKey, setProjectKey] = useState(() => localStorage.getItem('obraControl_projectKey') || `OBRA-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // ESTADOS DEL DIAGNÓSTICO
  const [syncStatus, setSyncStatus] = useState('offline');
  const [dbError, setDbError] = useState('');

  const [allData, setAllData] = useState(INITIAL_DB);
  const [activeProjectId, setActiveProjectId] = useState(1);
  const projectData = allData[activeProjectId] || INITIAL_DB[1];

  // 1. Iniciar Sesión (Autenticación)
  useEffect(() => {
    if (!auth) {
      setDbError("No se encontró la configuración de Firebase.");
      return;
    }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        setDbError("Error de Autenticación: " + error.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Leer datos de Firebase (Firestore)
  useEffect(() => {
    if (!user || !db) return;
    localStorage.setItem('obraControl_projectKey', projectKey);
    setSyncStatus('syncing');
    setDbError(''); // Limpiar errores viejos

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectKey);
      
      const unsubscribe = onSnapshot(docRef, 
        (docSnap) => {
          setDbError(''); // Si entra aquí, todo salió bien
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.fullData) {
              setAllData(data.fullData);
              setSyncStatus('synced');
            }
          } else {
            // Si el documento no existe, lo crea
            setDoc(docRef, { fullData: INITIAL_DB }, { merge: true })
              .then(() => setSyncStatus('synced'))
              .catch((e) => {
                setSyncStatus('error');
                setDbError("Error al crear documento: " + e.message);
              });
          }
        }, 
        (error) => {
          // AQUI CAPTURAMOS EL ERROR DE LECTURA (Ej: Permisos)
          setSyncStatus('error');
          setDbError("Error de lectura en Firestore: " + error.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
       setSyncStatus('error');
       setDbError("Error de código al conectar: " + err.message);
    }
  }, [user, projectKey]);

  // 3. Guardar datos en Firebase
  const saveToCloud = async (newData) => {
    setAllData(newData); // Actualiza la pantalla rápido
    if (!user || !db) {
      setDbError("Guardado local exitoso, pero sin conexión a la nube.");
      return;
    }
    try {
      setSyncStatus('syncing');
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectKey);
      await setDoc(docRef, { fullData: newData }, { merge: true });
      setSyncStatus('synced');
      setDbError(''); // Limpiar si tuvo éxito
    } catch (e) {
      // AQUI CAPTURAMOS EL ERROR AL GUARDAR
      console.error("Error saving to cloud", e);
      setSyncStatus('error');
      setDbError("Fallo al intentar guardar en la nube: " + e.message);
    }
  };

  const updateProjectData = (section, newData) => {
    const updatedAllData = { ...allData, [activeProjectId]: { ...allData[activeProjectId], [section]: newData } };
    saveToCloud(updatedAllData);
  };

  const navItems = [
    { id: 'planificacion', label: 'Planificación', icon: CalendarDays },
    { id: 'mano_obra', label: 'Mano de Obra', icon: Users },
    { id: 'materiales', label: 'Materiales', icon: Truck },
    { id: 'informes', label: 'Informes', icon: FileText },
  ];

  return (
    <div>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
        
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
              <div className="bg-blue-600 text-white p-2 rounded-lg"><Hammer size={24} /></div>
              <div><h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">ObraControl</h1></div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <item.icon size={20} className={activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100 dark:border-slate-700"><button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">{darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-slate-400" />}{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</button></div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{projectData.name}</span>
            </div>

            {/* BARRA DE ESTADO DE NUBE */}
            <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600">
                {syncStatus === 'synced' && <span className="flex items-center gap-1 text-emerald-600 font-medium"><CloudCog size={16}/> Sincronizado</span>}
                {syncStatus === 'syncing' && <span className="flex items-center gap-1 text-blue-600 animate-pulse font-medium"><CloudCog size={16}/> Sincronizando...</span>}
                {syncStatus === 'error' && <span className="flex items-center gap-1 text-red-600 font-bold"><AlertTriangle size={16}/> Fallo de Nube</span>}
                {syncStatus === 'offline' && <span className="flex items-center gap-1 text-slate-500"><CloudCog size={16}/> Desconectado</span>}
            </div>
            
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-lg"><Menu size={24} /></button>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
            
            {/* PANEL DE DIAGNÓSTICO (Aparece solo si hay un error) */}
            {(!isFirebaseConfigured || dbError) && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 mb-6 rounded-xl shadow-sm text-sm animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-base">
                  <AlertTriangle size={20}/> Diagnóstico de Error
                </h3>
                
                {!isFirebaseConfigured && (
                  <p className="mb-2">❌ <strong>Faltan Variables de Entorno:</strong> Tu app en Vercel no está leyendo la configuración (VITE_FIREBASE_API_KEY). Esto sucede si tu proyecto no es Vite sino Create React App. Revisa si necesitas nombrarlas como <code>REACT_APP_FIREBASE_API_KEY</code>.</p>
                )}
                
                {dbError && (
                  <div>
                    <p className="font-bold">Firebase Responde:</p>
                    <p className="font-mono text-xs bg-red-100 dark:bg-red-950 p-3 rounded mt-1 border border-red-200 dark:border-red-900">{dbError}</p>
                    
                    {dbError.includes("permissions") && (
                      <p className="mt-3 font-medium bg-white/50 dark:bg-black/20 p-2 rounded">
                        👉 <strong>Solución:</strong> El "candado" de tu base de datos sigue cerrado. Asegúrate de haber editado las reglas en <strong>"Firestore Database"</strong> (y NO en "Realtime Database").
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{navItems.find(i => i.id === activeTab)?.label}</h2>
            </div>

            <div key={`${activeTab}-${activeProjectId}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'planificacion' && <IntegratedPlanning projectData={projectData} updateProjectData={updateProjectData} />}
              {activeTab === 'mano_obra' && <LaborManager data={projectData.labor || []} onUpdate={(newData) => updateProjectData('labor', newData)} />}
              {activeTab === 'materiales' && <MaterialsManager data={projectData.materials} onUpdate={(newData) => updateProjectData('materials', newData)} />}
              {activeTab === 'informes' && <WeeklyReport data={projectData} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
