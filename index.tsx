import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, BookOpen, Target, PlayCircle, Beaker, Hexagon, 
  Gamepad2, CheckSquare, BarChart2, User, Menu, X, 
  ChevronRight, ChevronLeft, Volume2, VolumeX, Info,
  Award, Play, Lock, FileText, Database, Shield
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// ============================================================================
// 1. FIREBASE SETUP & AUTHENTICATION (STRICT RULES APPLIED)
// ============================================================================
let app, auth, db, appId = 'mpi-hidrokarbon';
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (typeof __app_id !== 'undefined') appId = __app_id;
} catch (error) {
  console.error("Firebase init error:", error);
}

// ============================================================================
// 2. DATA CONSTANTS
// ============================================================================
const QUIZ_DATA = [
  { id: 1, type: 'pg', q: 'Senyawa hidrokarbon adalah senyawa yang hanya terdiri dari unsur...', options: ['Karbon dan Oksigen', 'Karbon dan Hidrogen', 'Hidrogen dan Oksigen', 'Karbon dan Nitrogen'], a: 'Karbon dan Hidrogen' },
  { id: 2, type: 'pg', q: 'Salah satu kekhasan atom karbon adalah...', options: ['Memiliki 2 elektron valensi', 'Hanya dapat membentuk ikatan ionik', 'Dapat membentuk 4 ikatan kovalen', 'Berwujud gas pada suhu ruang'], a: 'Dapat membentuk 4 ikatan kovalen' },
  { id: 3, type: 'pg', q: 'Atom karbon yang berikatan langsung dengan dua atom karbon lainnya disebut atom karbon...', options: ['Primer', 'Sekunder', 'Tersier', 'Kuarterner'], a: 'Sekunder' },
  { id: 4, type: 'pg', q: 'Rumus umum untuk senyawa golongan alkana adalah...', options: ['CnH2n', 'CnH2n-2', 'CnH2n+2', 'CnH2n+1'], a: 'CnH2n+2' },
  { id: 5, type: 'pg', q: 'Senyawa C3H8 diberi nama...', options: ['Metana', 'Etana', 'Propana', 'Butana'], a: 'Propana' },
  { id: 6, type: 'bs', q: 'Alkena merupakan senyawa hidrokarbon tak jenuh yang memiliki minimal satu ikatan rangkap dua.', options: ['Benar', 'Salah'], a: 'Benar' },
  { id: 7, type: 'pg', q: 'Nama senyawa untuk C2H2 adalah...', options: ['Etana', 'Etena', 'Etuna', 'Etanol'], a: 'Etuna' },
  { id: 8, type: 'pg', q: 'Dua senyawa yang memiliki rumus molekul sama tetapi rumus strukturnya berbeda disebut...', options: ['Isotop', 'Isobar', 'Isomer', 'Polimer'], a: 'Isomer' },
  { id: 9, type: 'bs', q: 'Pada penamaan IUPAC, rantai utama dipilih dari rantai karbon yang terpendek.', options: ['Benar', 'Salah'], a: 'Salah' },
  { id: 10, type: 'pg', q: 'Komponen utama penyusun gas alam dan LPG adalah senyawa golongan...', options: ['Alkuna', 'Alkana', 'Alkohol', 'Ester'], a: 'Alkana' },
  { id: 11, type: 'pg', q: 'Berapakah jumlah atom karbon primer pada senyawa 2-metilpropana (isobutana)?', options: ['1', '2', '3', '4'], a: '3' },
  { id: 12, type: 'bs', q: 'Ikatan rangkap tiga pada alkuna lebih pendek dan lebih kuat dibandingkan ikatan tunggal pada alkana.', options: ['Benar', 'Salah'], a: 'Benar' },
  { id: 13, type: 'pg', q: 'Cabang pada rantai utama hidrokarbon disebut gugus...', options: ['Alkana', 'Alkil', 'Alkenil', 'Alkoksi'], a: 'Alkil' },
  { id: 14, type: 'pg', q: 'Gugus alkil dengan rumus -CH3 disebut...', options: ['Etil', 'Propil', 'Butil', 'Metil'], a: 'Metil' },
  { id: 15, type: 'bs', q: 'Senyawa dengan rumus molekul C4H10 memiliki 2 isomer rangka.', options: ['Benar', 'Salah'], a: 'Benar' },
  { id: 16, type: 'pg', q: 'Bahan bakar kendaraan bermotor (bensin) utamanya tersusun dari campuran hidrokarbon dengan rantai...', options: ['C1 - C4', 'C5 - C12', 'C15 - C20', 'Di atas C20'], a: 'C5 - C12' },
  { id: 17, type: 'pg', q: 'Reaksi pembakaran sempurna hidrokarbon akan menghasilkan...', options: ['CO dan H2O', 'CO2 dan H2O', 'C dan H2', 'CO2 dan H2'], a: 'CO2 dan H2O' },
  { id: 18, type: 'bs', q: 'Senyawa 1-butena dan 2-butena merupakan contoh dari isomer posisi.', options: ['Benar', 'Salah'], a: 'Benar' },
  { id: 19, type: 'pg', q: 'Berapa jumlah ikatan hidrogen pada 1 molekul etana (C2H6)?', options: ['4', '5', '6', '8'], a: '6' },
  { id: 20, type: 'bs', q: 'Atom Karbon dapat membentuk rantai lurus, bercabang, maupun melingkar (siklik).', options: ['Benar', 'Salah'], a: 'Benar' },
];

const MATERI_DATA = [
  {
    title: "1. Pengertian Hidrokarbon",
    content: (
      <div className="space-y-4 text-slate-700">
        <p><strong>Senyawa Hidrokarbon</strong> adalah senyawa karbon yang paling sederhana. Seperti namanya, senyawa ini hanya tersusun dari dua jenis unsur, yaitu:</p>
        <div className="flex gap-4 my-4">
          <div className="flex-1 bg-orange-50 border border-orange-200 p-4 rounded-xl text-center shadow-sm">
            <div className="text-3xl font-bold text-orange-600 mb-1">C</div>
            <div className="font-semibold text-orange-800">Karbon</div>
          </div>
          <div className="flex-1 bg-green-50 border border-green-200 p-4 rounded-xl text-center shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-1">H</div>
            <div className="font-semibold text-green-800">Hidrogen</div>
          </div>
        </div>
        <p>Meskipun hanya tersusun dari dua unsur, hidrokarbon memiliki ribuan jenis senyawa dengan sifat yang berbeda-beda, mulai dari gas alam (metana) hingga aspal jalanan.</p>
      </div>
    )
  },
  {
    title: "2. Kekhasan Atom Karbon",
    content: (
      <div className="space-y-4 text-slate-700">
        <p>Atom Karbon (C) memiliki nomor atom 6 (konfigurasi: 2, 4). Terdapat beberapa keistimewaan yang membuatnya sangat spesial:</p>
        <ul className="space-y-3">
          <li className="flex gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex justify-center items-center font-bold shrink-0">1</div>
            <div>
              <strong className="text-blue-900 block mb-1">Membentuk 4 Ikatan Kovalen</strong>
              Karena memiliki 4 elektron valensi, atom C membutuhkan 4 elektron lagi untuk stabil (oktet). Ia dapat mengikat 4 atom lain.
            </div>
          </li>
          <li className="flex gap-3 bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex justify-center items-center font-bold shrink-0">2</div>
            <div>
              <strong className="text-orange-900 block mb-1">Membentuk Rantai Karbon</strong>
              Atom C sangat mudah berikatan kovalen dengan atom C lainnya, membentuk rantai yang panjang (lurus, bercabang, atau siklik/melingkar).
            </div>
          </li>
          <li className="flex gap-3 bg-green-50 p-4 rounded-xl border border-green-100">
            <div className="bg-green-500 text-white w-8 h-8 rounded-full flex justify-center items-center font-bold shrink-0">3</div>
            <div>
              <strong className="text-green-900 block mb-1">Membentuk Ikatan Rangkap</strong>
              Antar atom C dapat membentuk ikatan kovalen tunggal (C-C), rangkap dua (C=C), maupun rangkap tiga (C≡C).
            </div>
          </li>
        </ul>
      </div>
    )
  },
  {
    title: "3. Jenis Atom Karbon",
    content: (
      <div className="space-y-4 text-slate-700">
        <p>Berdasarkan jumlah atom karbon lain yang diikatnya, posisi atom C dalam rantai dibedakan menjadi 4 jenis:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
            <h4 className="font-bold text-blue-700 text-lg">1° (Primer)</h4>
            <p className="text-sm mt-1">Mengikat <strong>1</strong> atom C lain.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm">
            <h4 className="font-bold text-green-700 text-lg">2° (Sekunder)</h4>
            <p className="text-sm mt-1">Mengikat <strong>2</strong> atom C lain.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
            <h4 className="font-bold text-orange-700 text-lg">3° (Tersier)</h4>
            <p className="text-sm mt-1">Mengikat <strong>3</strong> atom C lain.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-l-4 border-purple-500 shadow-sm">
            <h4 className="font-bold text-purple-700 text-lg">4° (Kuarterner)</h4>
            <p className="text-sm mt-1">Mengikat <strong>4</strong> atom C lain.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "4. Alkana, Alkena, Alkuna",
    content: (
      <div className="space-y-4 text-slate-700">
        <p>Berdasarkan jenis ikatannya, hidrokarbon alifatik (rantai terbuka) digolongkan menjadi tiga:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left bg-white rounded-lg overflow-hidden shadow-sm border">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3">Golongan</th>
                <th className="p-3">Jenis Ikatan</th>
                <th className="p-3">Rumus Umum</th>
                <th className="p-3">Sifat</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="p-3 font-bold text-blue-800">Alkana</td><td className="p-3">Tunggal (C-C)</td><td className="p-3 font-mono bg-slate-50">CnH2n+2</td><td className="p-3 text-green-700">Jenuh</td></tr>
              <tr className="border-b"><td className="p-3 font-bold text-blue-800">Alkena</td><td className="p-3">Rangkap 2 (C=C)</td><td className="p-3 font-mono bg-slate-50">CnH2n</td><td className="p-3 text-orange-600">Tak Jenuh</td></tr>
              <tr><td className="p-3 font-bold text-blue-800">Alkuna</td><td className="p-3">Rangkap 3 (C≡C)</td><td className="p-3 font-mono bg-slate-50">CnH2n-2</td><td className="p-3 text-orange-600">Tak Jenuh</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    title: "5. Deret Homolog & Rumus",
    content: (
      <div className="space-y-4 text-slate-700">
        <p>Deret homolog adalah deret senyawa yang memiliki rumus umum dan gugus fungsi sama, selisih tiap sukunya adalah -CH2-.</p>
        <h4 className="font-bold text-blue-800">10 Suku Pertama Alkana (Wajib Hafal!)</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C1:</strong> Metana (CH4)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C2:</strong> Etana (C2H6)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C3:</strong> Propana (C3H8)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C4:</strong> Butana (C4H10)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C5:</strong> Pentana (C5H12)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C6:</strong> Heksana (C6H14)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C7:</strong> Heptana (C7H16)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C8:</strong> Oktana (C8H18)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C9:</strong> Nonana (C9H20)</div>
          <div className="bg-white p-2 rounded border shadow-sm"><strong>C10:</strong> Dekana (C10H22)</div>
        </div>
      </div>
    )
  },
  {
    title: "6. Tata Nama IUPAC",
    content: (
      <div className="space-y-4 text-slate-700">
        <p>Aturan dasar penamaan senyawa hidrokarbon bercabang:</p>
        <ol className="list-decimal pl-5 space-y-2 bg-blue-50 p-4 rounded-xl">
          <li><strong>Rantai Utama:</strong> Tentukan rantai karbon terpanjang. (Jika alkena/alkuna, rantai harus memuat ikatan rangkap).</li>
          <li><strong>Penomoran:</strong> Beri nomor dari ujung yang paling dekat dengan cabang (alkana) atau paling dekat dengan ikatan rangkap (alkena/alkuna).</li>
          <li><strong>Nama Cabang (Alkil):</strong> Diberi nama alkana yang kehilangan 1 atom H (akhiran -il, contoh: metil, etil).</li>
          <li><strong>Urutan Penulisan:</strong> Nomor cabang - Nama cabang - Nomor ikatan rangkap (jika ada) - Nama rantai utama.</li>
        </ol>
        <div className="bg-white p-3 rounded-lg border-l-4 border-orange-500 mt-2">
          <strong>Contoh Alkana:</strong> 2-metilbutana<br/>
          <strong>Contoh Alkena:</strong> 2-metil-1-butena
        </div>
      </div>
    )
  },
  {
    title: "7. Isomer Hidrokarbon",
    content: (
      <div className="space-y-4 text-slate-700">
        <p><strong>Isomer</strong> adalah senyawa-senyawa yang memiliki <em>rumus molekul sama</em> tetapi <em>strukturnya berbeda</em>.</p>
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800">Contoh Isomer C4H10 (Butana):</h4>
          <ul className="list-disc pl-5 mt-2">
            <li><strong>n-butana:</strong> Rantai lurus (CH3-CH2-CH2-CH3)</li>
            <li><strong>2-metilpropana:</strong> Rantai utama C3, ada cabang metil di C nomor 2.</li>
          </ul>
          <p className="mt-2 text-sm text-slate-600">Keduanya memiliki jumlah C=4 dan H=10, namun bentuk rantainya berbeda (Isomer Rangka).</p>
        </div>
      </div>
    )
  },
  {
    title: "8. Sifat & Kegunaan",
    content: (
      <div className="space-y-4 text-slate-700">
        <h4 className="font-bold text-blue-800">Sifat Fisika Umum:</h4>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Titik didih meningkat seiring bertambahnya rantai C.</li>
          <li>Makin banyak cabang, titik didih makin rendah (pada isomer).</li>
          <li>Tidak larut dalam air (non-polar).</li>
        </ul>
        <h4 className="font-bold text-orange-800 mt-4">Kegunaan Sehari-hari:</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-3 rounded shadow-sm border border-l-4 border-blue-500"><strong>Metana / Propana:</strong> Gas bakar (LPG)</div>
          <div className="bg-white p-3 rounded shadow-sm border border-l-4 border-orange-500"><strong>Oktana cs:</strong> Bensin kendaraan</div>
          <div className="bg-white p-3 rounded shadow-sm border border-l-4 border-green-500"><strong>Etena:</strong> Bahan baku plastik (Polietilena)</div>
          <div className="bg-white p-3 rounded shadow-sm border border-l-4 border-purple-500"><strong>Etuna (Asetilena):</strong> Gas las karbit</div>
        </div>
      </div>
    )
  }
];

// ============================================================================
// 3. MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  
  // App States
  const [student, setStudent] = useState(null); 
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioCtxRef = useRef(null);

  // Firebase Auth Initialization (Strict Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        setAuthError("Gagal terhubung ke sistem penyimpanan.");
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Sound Helper
  const playSound = (type = 'click') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) { console.log(e); }
  };

  const navTo = (menu) => { playSound(); setActiveMenu(menu); setSidebarOpen(false); };

  // ============================================================================
  // VIEWS
  // ============================================================================

  // --- 1. BERANDA ---
  const HomeView = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 animate-fade-in relative z-10">
      <div className="relative w-64 h-64 mb-6 flex justify-center items-center">
        {/* CSS Molecule Animation */}
        <div className="absolute w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.8)] z-20 flex items-center justify-center text-white font-bold text-xl border-2 border-white/50">C</div>
        
        {/* Orbits & Hydrogens */}
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`absolute w-full h-full animate-spin-slow`} style={{ animationDelay: `${i * -3.75}s` }}>
            <div className="absolute top-0 left-1/2 -ml-6 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg border-2 border-white/50 flex items-center justify-center text-white font-bold text-sm transform -translate-y-2">H</div>
            {/* Bond Line */}
            <div className="absolute top-10 left-1/2 w-1 h-20 bg-white/40 -ml-[0.5px]"></div>
          </div>
        ))}
        {/* Inner decoration */}
        <div className="absolute w-32 h-32 border-4 border-dashed border-white/20 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/50 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-green-600 to-orange-500 mb-4 drop-shadow-sm">
          DUNIA HIDROKARBON
        </h1>
        <p className="text-lg text-slate-600 mb-8 font-medium">
          Jelajahi keajaiban atom karbon dalam kehidupan kita. Media Pembelajaran Interaktif Kimia Kelas X Fase E.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => navTo('materi')} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
            <BookOpen className="w-5 h-5"/> Mulai Belajar
          </button>
          <button onClick={() => navTo('lab')} className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
            <Beaker className="w-5 h-5"/> Lab Virtual
          </button>
        </div>
      </div>
    </div>
  );

  // --- 2. CP & TP ---
  const CPTPView = () => (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in z-10 relative">
      <div className="bg-white rounded-3xl shadow-xl p-8 border-t-8 border-blue-600 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-blue-50 opacity-50"><Target className="w-48 h-48"/></div>
        <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-3 relative z-10"><Target className="text-blue-600"/> Capaian Pembelajaran (Fase E)</h2>
        <p className="text-slate-700 leading-relaxed text-lg bg-blue-50/50 p-6 rounded-2xl relative z-10 border border-blue-100">
          Peserta didik mampu mengamati, menyelidiki dan menjelaskan fenomena sesuai kaidah kerja ilmiah dalam menjelaskan konsep kimia dalam kehidupan sehari-hari; <strong>menerapkan konsep kimia dalam pengelolaan lingkungan termasuk menjelaskan fenomena pemanasan global (yang berkaitan dengan pembakaran hidrokarbon)</strong>; menuliskan reaksi kimia dan menerapkan hukum-hukum dasar kimia; memahami struktur atom dan aplikasinya.
        </p>
      </div>
      <div className="bg-white rounded-3xl shadow-xl p-8 border-t-8 border-green-500">
        <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3"><CheckSquare className="text-green-600"/> Tujuan Pembelajaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Menjelaskan pengertian senyawa hidrokarbon.",
            "Memahami kekhasan atom karbon.",
            "Mengidentifikasi atom karbon primer, sekunder, tersier, dan kuarterner.",
            "Membedakan senyawa alkana, alkena, dan alkuna.",
            "Menuliskan rumus molekul dan rumus struktur hidrokarbon.",
            "Memahami aturan tata nama senyawa (IUPAC).",
            "Mengidentifikasi isomer pada senyawa hidrokarbon.",
            "Menjelaskan sifat dan kegunaan hidrokarbon dalam kehidupan."
          ].map((tp, i) => (
            <div key={i} className="flex gap-4 items-start bg-slate-50 hover:bg-green-50 p-4 rounded-xl border border-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-green-200 text-green-800 font-bold flex items-center justify-center shrink-0 shadow-sm">{i+1}</div>
              <span className="text-slate-700 font-medium pt-1 text-sm">{tp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- 3. MATERI ---
  const MateriView = () => {
    const [page, setPage] = useState(0);
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Menu Samping */}
          <div className="w-full md:w-1/3 bg-white rounded-3xl shadow-xl p-4 border border-slate-100 h-fit sticky top-20">
            <h3 className="font-bold text-slate-800 mb-4 px-2 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600"/> Daftar Materi</h3>
            <div className="flex flex-col gap-2">
              {MATERI_DATA.map((m, i) => (
                <button 
                  key={i} 
                  onClick={() => { playSound(); setPage(i); }}
                  className={`text-left px-4 py-3 rounded-xl transition-all font-medium text-sm border-l-4 
                    ${page === i ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
                >
                  {m.title}
                </button>
              ))}
            </div>
          </div>
          
          {/* Konten */}
          <div className="w-full md:w-2/3 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-green-500 p-6 text-white text-center relative">
              <h2 className="text-2xl font-bold drop-shadow-md">{MATERI_DATA[page].title}</h2>
            </div>
            <div className="p-6 md:p-8 flex-1 min-h-[400px]">
              {MATERI_DATA[page].content}
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
              <button onClick={() => { playSound(); setPage(p => Math.max(0, p - 1)); }} disabled={page === 0} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all">
                <ChevronLeft className="inline w-5 h-5 mr-1"/> Sebelumnya
              </button>
              <div className="text-sm font-bold text-slate-400">{page + 1} / {MATERI_DATA.length}</div>
              <button onClick={() => { playSound(); setPage(p => Math.min(MATERI_DATA.length - 1, p + 1)); }} disabled={page === MATERI_DATA.length - 1} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-md disabled:opacity-50 transition-all">
                Selanjutnya <ChevronRight className="inline w-5 h-5 ml-1"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 4. LAB VIRTUAL ---
  const LabView = () => {
    const molecules = [
      { id: 'ch4', name: 'Metana', formula: 'CH4', type: 'alkana', info: 'Gas alam, Alkana paling sederhana. Berbentuk tetrahedral 3D.' },
      { id: 'c2h6', name: 'Etana', formula: 'C2H6', type: 'alkana', info: 'Memiliki 1 ikatan kovalen tunggal antar atom C (C-C).' },
      { id: 'c2h4', name: 'Etena', formula: 'C2H4', type: 'alkena', info: 'Memiliki 1 ikatan kovalen rangkap dua antar atom C (C=C).' },
      { id: 'c2h2', name: 'Etuna', formula: 'C2H2', type: 'alkuna', info: 'Memiliki 1 ikatan kovalen rangkap tiga antar atom C (C≡C). Bentuk linear.' }
    ];
    const [activeMol, setActiveMol] = useState(0);
    const m = molecules[activeMol];

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 animate-fade-in relative z-10">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center min-h-[500px] relative">
            
            {/* Panel Pilihan */}
            <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 z-10 flex flex-col">
              <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><Hexagon className="text-orange-400"/> Simulasi Struktur</h3>
              <div className="flex flex-col gap-3 flex-1">
                {molecules.map((mol, i) => (
                  <button 
                    key={mol.id} onClick={() => { playSound(); setActiveMol(i); }}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${activeMol === i ? 'bg-orange-500/20 border-orange-400 text-white' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{mol.name}</span>
                      <span className="bg-black/30 px-2 py-1 rounded text-xs font-mono">{mol.formula}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 bg-blue-900/40 p-4 rounded-xl border border-blue-400/30">
                <p className="text-blue-100 text-sm leading-relaxed">{m.info}</p>
              </div>
            </div>

            {/* Canvas Molekul 2.5D */}
            <div className="w-full md:w-2/3 flex items-center justify-center relative min-h-[400px]">
              
              {/* Metana (CH4) */}
              {m.id === 'ch4' && (
                <div className="relative w-64 h-64 flex justify-center items-center">
                  <div className="absolute z-20 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_20px_orange] flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">C</div>
                  {[0, 90, 180, 270].map((deg, i) => (
                    <div key={i} className="absolute w-full h-full flex justify-center items-start animate-pulse" style={{ transform: `rotate(${deg}deg)`, animationDuration: '3s' }}>
                      <div className="w-1.5 h-14 bg-gradient-to-b from-transparent to-white/50 origin-bottom mt-2"></div>
                      <div className="absolute top-[-10px] w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20 shadow-lg">H</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Etana (C2H6) - Ikatan Tunggal */}
              {m.id === 'c2h6' && (
                <div className="relative flex items-center justify-center w-full max-w-[400px]">
                  {/* C1 */}
                  <div className="relative flex justify-center items-center mr-16">
                    <div className="absolute z-20 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_20px_orange] flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">C</div>
                    {[-120, -180, 120].map((deg, i) => (
                      <div key={i} className="absolute w-40 h-40 flex justify-center items-start" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className="w-1.5 h-12 bg-white/40 mt-4"></div>
                        <div className="absolute top-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">H</div>
                      </div>
                    ))}
                  </div>
                  {/* Ikatan C-C */}
                  <div className="absolute w-20 h-2 bg-white/60 z-10 left-1/2 -ml-10"></div>
                  {/* C2 */}
                  <div className="relative flex justify-center items-center ml-16">
                    <div className="absolute z-20 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_20px_orange] flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">C</div>
                    {[0, 60, -60].map((deg, i) => (
                      <div key={i} className="absolute w-40 h-40 flex justify-center items-start" style={{ transform: `rotate(${deg}deg)` }}>
                         <div className="w-1.5 h-12 bg-white/40 mt-4"></div>
                         <div className="absolute top-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">H</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etena (C2H4) - Ikatan Rangkap Dua */}
              {m.id === 'c2h4' && (
                <div className="relative flex items-center justify-center w-full max-w-[400px]">
                  <div className="relative flex justify-center items-center mr-16">
                    <div className="absolute z-20 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_20px_orange] flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">C</div>
                    {[-135, 135].map((deg, i) => (
                      <div key={i} className="absolute w-40 h-40 flex justify-center items-start" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className="w-1.5 h-12 bg-white/40 mt-4"></div>
                        <div className="absolute top-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">H</div>
                      </div>
                    ))}
                  </div>
                  {/* Ikatan C=C */}
                  <div className="absolute w-20 h-1.5 bg-white/80 z-10 left-1/2 -ml-10 -mt-3 shadow-[0_0_5px_white]"></div>
                  <div className="absolute w-20 h-1.5 bg-white/80 z-10 left-1/2 -ml-10 mt-3 shadow-[0_0_5px_white]"></div>
                  
                  <div className="relative flex justify-center items-center ml-16">
                    <div className="absolute z-20 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_20px_orange] flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">C</div>
                    {[45, -45].map((deg, i) => (
                      <div key={i} className="absolute w-40 h-40 flex justify-center items-start" style={{ transform: `rotate(${deg}deg)` }}>
                         <div className="w-1.5 h-12 bg-white/40 mt-4"></div>
                         <div className="absolute top-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">H</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etuna (C2H2) - Ikatan Rangkap Tiga */}
              {m.id === 'c2h2' && (
                <div className="relative flex items-center justify-center w-full max-w-[400px]">
                  <div className="relative flex justify-center items-center mr-16">
                    <div className="absolute z-20 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_20px_orange] flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">C</div>
                    <div className="absolute w-40 h-40 flex justify-center items-start" style={{ transform: `rotate(-180deg)` }}>
                      <div className="w-1.5 h-12 bg-white/40 mt-4"></div>
                      <div className="absolute top-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">H</div>
                    </div>
                  </div>
                  {/* Ikatan C≡C */}
                  <div className="absolute w-20 h-1.5 bg-white/90 z-10 left-1/2 -ml-10 -mt-5 shadow-[0_0_8px_white]"></div>
                  <div className="absolute w-20 h-1.5 bg-white/90 z-10 left-1/2 -ml-10 mt-0 shadow-[0_0_8px_white]"></div>
                  <div className="absolute w-20 h-1.5 bg-white/90 z-10 left-1/2 -ml-10 mt-5 shadow-[0_0_8px_white]"></div>
                  
                  <div className="relative flex justify-center items-center ml-16">
                    <div className="absolute z-20 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_0_20px_orange] flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">C</div>
                    <div className="absolute w-40 h-40 flex justify-center items-start" style={{ transform: `rotate(0deg)` }}>
                        <div className="w-1.5 h-12 bg-white/40 mt-4"></div>
                        <div className="absolute top-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">H</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    );
  };

  // --- 5. GAME EDUKATIF ---
  const GameView = () => {
    const pairs = [
      { id: 1, formula: 'CH4', name: 'Metana' },
      { id: 2, formula: 'C2H4', name: 'Etena' },
      { id: 3, formula: 'C3H8', name: 'Propana' },
      { id: 4, formula: 'C2H2', name: 'Etuna' },
      { id: 5, formula: 'C4H10', name: 'Butana' }
    ];
    
    // State initialization only once
    const [formulas, setFormulas] = useState([]);
    const [names, setNames] = useState([]);
    const [selectedFormula, setSelectedFormula] = useState(null);
    const [selectedName, setSelectedName] = useState(null);
    const [matched, setMatched] = useState([]);
    const [won, setWon] = useState(false);

    useEffect(() => {
      resetGame();
    }, []);

    const resetGame = () => {
      setFormulas([...pairs].sort(() => Math.random() - 0.5));
      setNames([...pairs].sort(() => Math.random() - 0.5));
      setSelectedFormula(null); setSelectedName(null);
      setMatched([]); setWon(false);
    };

    useEffect(() => {
      if (selectedFormula && selectedName) {
        if (selectedFormula.id === selectedName.id) {
          playSound('success');
          setMatched(prev => [...prev, selectedFormula.id]);
          setSelectedFormula(null); setSelectedName(null);
        } else {
          playSound('wrong');
          setTimeout(() => {
            setSelectedFormula(null); setSelectedName(null);
          }, 600);
        }
      }
    }, [selectedFormula, selectedName]);

    useEffect(() => {
      if (matched.length === pairs.length && pairs.length > 0) {
        setTimeout(() => { playSound('success'); setWon(true); }, 500);
      }
    }, [matched]);

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in relative z-10">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-orange-500 p-8 text-center min-h-[500px] flex flex-col">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 flex items-center justify-center gap-3"><Gamepad2 className="text-orange-500 w-8 h-8"/> Petualangan Mencocokkan</h2>
          <p className="text-slate-600 mb-8">Pilih kotak Rumus Molekul (Kiri) dan Nama Senyawa (Kanan) yang sesuai!</p>

          {won ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
              <Award className="w-24 h-24 text-yellow-400 mb-4 animate-bounce"/>
              <h3 className="text-3xl font-bold text-green-600 mb-2">Luar Biasa!</h3>
              <p className="text-slate-600 mb-6">Kamu berhasil mencocokkan semua senyawa dengan benar.</p>
              <button onClick={resetGame} className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-md">Main Lagi</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row gap-8 justify-center relative">
              
              {/* Kolom Rumus */}
              <div className="flex-1 flex flex-col gap-3">
                <h4 className="font-bold text-blue-700 bg-blue-50 py-2 rounded-lg mb-2">Rumus Molekul</h4>
                {formulas.map(f => {
                  const isMatched = matched.includes(f.id);
                  const isSelected = selectedFormula?.id === f.id;
                  return (
                    <button 
                      key={`f-${f.id}`}
                      disabled={isMatched}
                      onClick={() => { playSound(); setSelectedFormula(f); }}
                      className={`p-4 rounded-xl font-mono text-xl font-bold transition-all border-2
                        ${isMatched ? 'bg-green-100 border-green-300 text-green-400 opacity-50' : 
                          isSelected ? 'bg-blue-500 border-blue-600 text-white transform scale-105 shadow-lg' : 
                          'bg-white border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-400 shadow-sm'}`}
                    >
                      {f.formula}
                    </button>
                  );
                })}
              </div>

              {/* Garis Pemisah Virtual */}
              <div className="hidden md:flex flex-col justify-center text-slate-300">
                <div className="w-1 h-full bg-slate-100 rounded-full"></div>
              </div>

              {/* Kolom Nama */}
              <div className="flex-1 flex flex-col gap-3">
                <h4 className="font-bold text-orange-700 bg-orange-50 py-2 rounded-lg mb-2">Nama Senyawa</h4>
                {names.map(n => {
                  const isMatched = matched.includes(n.id);
                  const isSelected = selectedName?.id === n.id;
                  return (
                    <button 
                      key={`n-${n.id}`}
                      disabled={isMatched}
                      onClick={() => { playSound(); setSelectedName(n); }}
                      className={`p-4 rounded-xl font-bold text-lg transition-all border-2
                        ${isMatched ? 'bg-green-100 border-green-300 text-green-400 opacity-50' : 
                          isSelected ? 'bg-orange-500 border-orange-600 text-white transform scale-105 shadow-lg' : 
                          'bg-white border-orange-200 text-orange-800 hover:bg-orange-50 hover:border-orange-400 shadow-sm'}`}
                    >
                      {n.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- 6. EVALUASI (KUIS) ---
  const EvaluasiView = () => {
    const [start, setStart] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [finished, setFinished] = useState(false);
    const [scoreInfo, setScoreInfo] = useState(null);
    const [timeLeft, setTimeLeft] = useState(1200); // 20 Menit

    useEffect(() => {
      let timer;
      if (start && !finished && timeLeft > 0) {
        timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      } else if (timeLeft === 0 && start && !finished) {
        submitQuiz();
      }
      return () => clearInterval(timer);
    }, [start, finished, timeLeft]);

    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (val) => {
      setAnswers(prev => ({...prev, [currentQ]: val}));
    };

    const submitQuiz = async () => {
      playSound('success');
      let correct = 0;
      QUIZ_DATA.forEach((q, i) => {
        if (answers[i] === q.a) correct++;
      });
      const score = (correct / QUIZ_DATA.length) * 100;
      const res = { score, correct, wrong: QUIZ_DATA.length - correct };
      setScoreInfo(res);
      setFinished(true);

      // Save to Firebase (STRICT RULE 1 & 3: Auth check, specific path)
      if (user && student && student.name && db) {
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'evaluasi_hidrokarbon'), {
            studentName: student.name,
            studentClass: student.class,
            score: res.score,
            correct: res.correct,
            wrong: res.wrong,
            timestamp: serverTimestamp()
          });
        } catch (e) { console.error("Firebase save error:", e); }
      }
    };

    if (!student) {
      return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 animate-fade-in relative z-10 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-blue-600"/>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Identitas Peserta Didik</h2>
          <p className="text-sm text-slate-500 mb-6">Silakan isi data diri sebelum memulai evaluasi.</p>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Nama Lengkap</label>
              <input type="text" id="sname" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-slate-50" placeholder="Ketik nama lengkap..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Kelas</label>
              <input type="text" id="sclass" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 bg-slate-50" placeholder="Contoh: X-1" />
            </div>
            <button 
              onClick={() => {
                const n = document.getElementById('sname').value.trim();
                const c = document.getElementById('sclass').value.trim();
                if(n && c) { playSound(); setStudent({name: n, class: c}); }
              }}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md mt-4 transition-colors"
            >
              Lanjutkan
            </button>
            {authError && <p className="text-xs text-red-500 text-center mt-2">{authError}</p>}
          </div>
        </div>
      );
    }

    if (!start) {
      return (
        <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border-t-8 border-blue-600 text-center animate-fade-in relative z-10">
          <FileText className="w-20 h-20 text-blue-500 mx-auto mb-4"/>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Evaluasi Akhir</h2>
          <p className="text-slate-600 mb-6">Halo, <strong>{student.name}</strong> ({student.class}). Evaluasi ini bertujuan mengukur pemahamanmu tentang materi Hidrokarbon.</p>
          <div className="bg-blue-50 text-blue-800 p-5 rounded-2xl text-sm font-medium mb-8 text-left border border-blue-100">
            <ul className="list-disc pl-5 space-y-2">
              <li>Jumlah Soal: 20 Butir (Pilihan Ganda & Benar/Salah).</li>
              <li>Waktu Pengerjaan: 20 Menit.</li>
              <li>Pastikan koneksi stabil. Hasil akan langsung tersimpan.</li>
            </ul>
          </div>
          <button onClick={() => { playSound(); setStart(true); }} className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all text-lg flex justify-center items-center gap-2">
            <PlayCircle className="w-6 h-6"/> Mulai Kerjakan
          </button>
        </div>
      );
    }

    if (finished) {
      return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center animate-fade-in relative z-10">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-slate-100 mb-6 relative shadow-inner">
            <span className={`text-4xl font-extrabold ${scoreInfo.score >= 75 ? 'text-green-600' : 'text-red-500'}`}>{scoreInfo.score.toFixed(0)}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Hasil Evaluasi</h2>
          <p className="text-slate-500 font-medium mb-8">{student.name} • Kelas {student.class}</p>
          
          <div className="flex justify-center gap-4 md:gap-6 mb-8">
            <div className="bg-green-50 px-6 py-4 rounded-2xl flex-1 border border-green-100 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">{scoreInfo.correct}</div>
              <div className="text-xs font-bold text-green-700 uppercase tracking-wide">Jawaban Benar</div>
            </div>
            <div className="bg-red-50 px-6 py-4 rounded-2xl flex-1 border border-red-100 shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">{scoreInfo.wrong}</div>
              <div className="text-xs font-bold text-red-700 uppercase tracking-wide">Jawaban Salah</div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl font-medium mb-8 ${scoreInfo.score >= 75 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
            {scoreInfo.score >= 75 ? 'Hebat! Anda telah menguasai materi Hidrokarbon dengan baik.' : 'Tetap semangat! Anda perlu membaca kembali materi untuk hasil yang lebih memuaskan.'}
          </div>
          
          <button onClick={() => { playSound(); setFinished(false); setStart(false); setAnswers({}); setCurrentQ(0); setStudent(null); setActiveMenu('home'); }} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-md">
            Kembali ke Beranda
          </button>
        </div>
      );
    }

    const q = QUIZ_DATA[currentQ];
    
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in relative z-10">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center font-bold">
            <span className="bg-blue-800/50 px-3 py-1.5 rounded-lg border border-blue-500/50 text-sm">Soal {currentQ + 1} / {QUIZ_DATA.length}</span>
            <span className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm ${timeLeft < 120 ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-blue-800/50 border-blue-500/50'}`}>
              Waktu: {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="p-6 md:p-8 min-h-[300px] flex flex-col justify-center">
            <div className="mb-4 text-sm font-bold text-orange-500 uppercase tracking-wider">
              {q.type === 'pg' ? 'Pilihan Ganda' : 'Benar / Salah'}
            </div>
            <p className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">{q.q}</p>
            
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { playSound(); handleAnswer(opt); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex items-center justify-between
                    ${answers[currentQ] === opt ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{opt}</span>
                  {answers[currentQ] === opt && <div className="w-4 h-4 rounded-full bg-blue-500"></div>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 flex justify-between border-t border-slate-200">
            <button 
              onClick={() => { playSound(); setCurrentQ(prev => Math.max(0, prev - 1)); }}
              disabled={currentQ === 0}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
            >
              Sebelumnya
            </button>
            
            {currentQ === QUIZ_DATA.length - 1 ? (
              <button 
                onClick={submitQuiz}
                disabled={answers[currentQ] === undefined}
                className="px-8 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 shadow-md transition-all"
              >
                Selesai & Kumpulkan
              </button>
            ) : (
              <button 
                onClick={() => { playSound(); setCurrentQ(prev => Math.min(QUIZ_DATA.length - 1, prev + 1)); }}
                className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors"
              >
                Berikutnya
              </button>
            )}
          </div>
        </div>
        
        {/* Navigasi Kotak Bawah */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {QUIZ_DATA.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === currentQ ? 'bg-orange-500 scale-150' : (answers[i] !== undefined) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
          ))}
        </div>
      </div>
    );
  };

  // --- 7. DASHBOARD GURU ---
  const DashboardView = () => {
    const [pwd, setPwd] = useState('');
    const [isAuthGuru, setIsAuthGuru] = useState(false);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      // STRICT RULE 3: Guard with `if (!user) return;`
      if (isAuthGuru && user && db) {
        setLoading(true);
        // STRICT RULE 1 & 2: Simple query to the exact public artifacts path
        const unsub = onSnapshot(
          collection(db, 'artifacts', appId, 'public', 'data', 'evaluasi_hidrokarbon'), 
          (snapshot) => {
            const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Memory sorting (Rule 2)
            fetched.sort((a, b) => b.score - a.score);
            setData(fetched);
            setLoading(false);
          },
          (error) => {
            console.error("Fetch error:", error);
            setLoading(false);
          }
        );
        return () => unsub();
      }
    }, [isAuthGuru, user]);

    if (!isAuthGuru) {
      return (
        <div className="max-w-sm mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-center relative z-10 border border-slate-100 animate-fade-in">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4"/>
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Akses Guru</h2>
          <p className="text-sm text-slate-500 mb-6">Masukkan kata sandi untuk melihat rekap nilai.</p>
          <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password (guru123)" className="w-full p-3.5 border-2 border-slate-200 rounded-xl mb-4 text-center focus:border-blue-500 focus:outline-none"/>
          <button onClick={() => { playSound(); if(pwd==='guru123') setIsAuthGuru(true); else alert('Password salah!'); }} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-900 transition-colors shadow-md">Buka Dasbor</button>
        </div>
      );
    }

    const avgScore = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.score, 0) / data.length).toFixed(1) : 0;

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 relative z-10 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl"><Database className="text-blue-600 w-8 h-8"/></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Rekap Hasil Evaluasi</h2>
              <p className="text-sm text-slate-500">Materi Hidrokarbon • SMAN 46 Maluku Tengah</p>
            </div>
          </div>
          <button onClick={() => { playSound(); setIsAuthGuru(false); setPwd(''); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-colors">Tutup Akses</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="text-sm font-bold text-slate-400 mb-1">Total Peserta</div>
            <div className="text-3xl font-extrabold text-blue-600">{data.length}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="text-sm font-bold text-slate-400 mb-1">Rata-rata Kelas</div>
            <div className="text-3xl font-extrabold text-green-500">{avgScore}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="text-sm font-bold text-slate-400 mb-1">Nilai Tertinggi</div>
            <div className="text-3xl font-extrabold text-orange-500">{data.length > 0 ? Math.max(...data.map(d=>d.score)).toFixed(0) : 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="text-sm font-bold text-slate-400 mb-1">Nilai Terendah</div>
            <div className="text-3xl font-extrabold text-red-500">{data.length > 0 ? Math.min(...data.map(d=>d.score)).toFixed(0) : 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-4 font-bold">No</th>
                  <th className="p-4 font-bold">Nama Peserta</th>
                  <th className="p-4 font-bold">Kelas</th>
                  <th className="p-4 font-bold">Nilai Akhir</th>
                  <th className="p-4 font-bold">Benar / Salah</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="5" className="p-8 text-center text-slate-400 animate-pulse">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">Belum ada data evaluasi.</td></tr>
                ) : (
                  data.map((r, i) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500">{i+1}</td>
                      <td className="p-4 font-bold text-slate-800">{r.studentName}</td>
                      <td className="p-4 text-slate-600">{r.studentClass}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${r.score >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.score.toFixed(0)}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium"><span className="text-green-600">{r.correct}</span> / <span className="text-red-500">{r.wrong}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  // ============================================================================
  // APP LAYOUT SHELL
  // ============================================================================
  const menuItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'cptp', label: 'Tujuan Belajar', icon: Target },
    { id: 'materi', label: 'Materi Pembelajaran', icon: BookOpen },
    { id: 'lab', label: 'Lab Virtual 3D', icon: Beaker },
    { id: 'game', label: 'Game Edukatif', icon: Gamepad2 },
    { id: 'evaluasi', label: 'Evaluasi Akhir', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen font-sans flex overflow-hidden selection:bg-orange-200 bg-slate-50 text-slate-800 relative">
      
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-blue-100/50 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] bg-green-100/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[20%] right-[20%] w-[60%] h-[60%] bg-orange-50/60 rounded-full blur-3xl"></div>
        {/* Hexagon Patterns SVG Background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="hex" width="28" height="49" patternUnits="userSpaceOnUse" patternTransform="scale(2)"><path d="M14 0l14 8v16l-14 8-14-8V8z" fill="none" stroke="currentColor" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#hex)"/>
        </svg>
      </div>

      {/* CSS KEYFRAMES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spinSlow 12s linear infinite; }
      `}} />

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block`}>
        <div className="p-6 bg-gradient-to-br from-blue-700 via-blue-600 to-green-600 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          <div className="relative z-10">
            <h2 className="font-extrabold text-2xl tracking-tight leading-tight">SMAN 46</h2>
            <p className="text-blue-100 text-sm font-medium">Maluku Tengah</p>
          </div>
          <button className="lg:hidden p-2 bg-white/20 rounded-xl hover:bg-white/30 backdrop-blur-sm relative z-10 transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu Utama</div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => navTo(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all
                ${activeMenu === item.id ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md transform scale-[1.02]' : 'text-slate-600 hover:bg-slate-100/80 hover:text-blue-700'}`}
            >
              <item.icon className={`w-5 h-5 ${activeMenu === item.id ? 'text-white' : 'text-slate-400'}`}/>
              {item.label}
            </button>
          ))}
          
          <div className="pt-8 px-2 mt-auto">
            <div className="w-full h-px bg-slate-200 mb-6"></div>
            <button onClick={() => navTo('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeMenu === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
              <Lock className="w-4 h-4"/> Akses Guru
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">S.S</div>
             <div className="text-xs">
               <div className="font-bold text-slate-700">Sarkia Silawane, S.Pd.</div>
               <div className="text-slate-500">Guru Kimia Fase E</div>
             </div>
           </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header Mobile */}
        <header className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-white/50 px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
          <button onClick={() => { playSound(); setSidebarOpen(true); }} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><Menu className="w-6 h-6"/></button>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-green-600">HIDROKARBON</span>
          <button onClick={() => { playSound(); setSoundEnabled(!soundEnabled); }} className="p-2 text-slate-500">
            {soundEnabled ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
          </button>
        </header>

        {/* Header Desktop (Sound) */}
        <div className="hidden lg:flex justify-end p-6 shrink-0 relative z-20 pointer-events-none">
          <button 
            onClick={() => { playSound(); setSoundEnabled(!soundEnabled); }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-slate-200/50 text-sm font-bold text-slate-600 hover:bg-white pointer-events-auto transition-all"
          >
            {soundEnabled ? <><Volume2 className="w-4 h-4 text-green-500"/> Suara Nyala</> : <><VolumeX className="w-4 h-4 text-red-500"/> Suara Mati</>}
          </button>
        </div>

        {/* Dynamic View rendering */}
        <main className="flex-1 overflow-y-auto p-2 md:p-6 pb-20 relative scroll-smooth">
          {activeMenu === 'home' && <HomeView />}
          {activeMenu === 'cptp' && <CPTPView />}
          {activeMenu === 'materi' && <MateriView />}
          {activeMenu === 'lab' && <LabView />}
          {activeMenu === 'game' && <GameView />}
          {activeMenu === 'evaluasi' && <EvaluasiView />}
          {activeMenu === 'dashboard' && <DashboardView />}
        </main>
      </div>

      {/* Overlay Sidebar Mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}