
import React, { useState, useEffect, useRef } from 'react';
import { Module, FormData, SoalPesantrenSection } from '../types';
import { KELAS_OPTIONS, MATA_PELAJARAN_OPTIONS, ALOKASI_WAKTU_OPTIONS, PESANTREN_SOAL_LETTERS, PESANTREN_SOAL_LETTERS_LATIN, ARABIC_SUBJECTS, EKSAK_SUBJECTS } from '../constants';
import Spinner from './Spinner';

interface GeneratorFormProps {
  module: Module;
  onSubmit: (formData: FormData) => void;
  onBack: () => void;
  onShowAIAssistant: (data: Partial<FormData>, type: 'cp' | 'topic') => void;
  isLoading: boolean;
  generationProgress: number;
}

const PESANTREN_INSTRUCTION_OPTIONS = [
    { value: "أجب عن الأسئلة الآتية!", text: "Jawablah pertanyaan berikut!" },
    { value: "اختر الإجابة الصحيحة مما بين القوسين!", text: "Pilihlah jawaban yang benar!" },
    { value: "املأ الفراغات بالكلمة المناسبة!", text: "Isilah titik-titik dengan kata yang sesuai!" },
    { value: "ترجم هذه الجمل إلى اللغة الإندونيسية!", text: "Terjemahkan ke Bahasa Indonesia!" },
    { value: "ترجم هذه الجمل إلى اللغة العربية!", text: "Terjemahkan ke Bahasa Arab!" },
    { value: "أعرب الكلمات التي تحتها خط!", text: "I'rab-lah kata yang bergaris bawah!" },
    { value: "كوّن جملا مفيدة من الكلمات الآتية!", text: "Buatlah kalimat dari kata-kata berikut!" },
    { value: "غير الفعل في الجملة الآتية!", text: "Ubahlah fi'il dalam kalimat berikut!" },
    { value: "custom", text: "Instruksi Lainnya..." },
];

// Define log steps for each module based on progress percentage milestones
const LOG_STEPS: Record<Module, { progress: number; message: string }[]> = {
    admin: [
        { progress: 5, message: "Menginisialisasi Model AI..." },
        { progress: 15, message: "Menganalisis Capaian Pembelajaran (CP) & Fase..." },
        { progress: 30, message: "Menyusun Alur Tujuan Pembelajaran (ATP)..." },
        { progress: 45, message: "Meng-generate Program Tahunan (Prota) & Semester (Promes)..." },
        { progress: 60, message: "Merancang Modul Ajar & Langkah Pembelajaran..." },
        { progress: 75, message: "Menyusun Kriteria Ketercapaian (KKTP)..." },
        { progress: 90, message: "Finalisasi format dokumen JSON..." },
        { progress: 100, message: "Selesai! Memuat hasil..." }
    ],
    soal: [
        { progress: 5, message: "Menginisialisasi Model AI..." },
        { progress: 15, message: "Menganalisis Topik & Tingkat Kesulitan..." },
        { progress: 30, message: "Menyusun Kisi-kisi Soal..." },
        { progress: 50, message: "Meng-generate Naskah Soal..." },
        { progress: 70, message: "Membuat Kunci Jawaban & Pembahasan..." },
        { progress: 85, message: "Melakukan Analisis Kualitatif & Rubrik..." },
        { progress: 95, message: "Finalisasi format dokumen..." },
        { progress: 100, message: "Selesai! Memuat hasil..." }
    ],
    ecourse: [
        { progress: 5, message: "Menginisialisasi Model AI..." },
        { progress: 20, message: "Merancang Struktur Silabus E-Course..." },
        { progress: 40, message: "Mengembangkan Materi per Pertemuan..." },
        { progress: 60, message: "Membuat Latihan & Evaluasi..." },
        { progress: 80, message: "Meng-generate Konten Slide Presentasi..." },
        { progress: 95, message: "Finalisasi paket E-Course..." },
        { progress: 100, message: "Selesai! Memuat hasil..." }
    ]
};

const GeneratorForm: React.FC<GeneratorFormProps> = ({ module, onSubmit, onBack, onShowAIAssistant, isLoading, generationProgress }) => {
  const [formData, setFormData] = useState<FormData>(() => {
    const defaultData: FormData = {
      jenjang: '', kelas: '', semester: '1', mata_pelajaran: '', 
      sekolah: 'SEKOLAH MENENGAH ATAS (SMA) ISLAM AL-GHOZALI',
      tahun_ajaran: '2025-2026', nama_guru: '', fase: '',
      cp_elements: '', alokasi_waktu: '', jumlah_modul_ajar: 1,
      topik_materi: '', sertakan_kisi_kisi: true, sertakan_soal_tka: false,
      jumlah_soal_tka: 10, sertakan_soal_tka_uraian: false, jumlah_soal_tka_uraian: 1,
      kelompok_tka: 'saintek',
      jenis_soal: ['Pilihan Ganda', 'Uraian'], jumlah_pg: 30, jumlah_uraian: 4,
      jumlah_isian_singkat: 0, 
      soal_pesantren_sections: [],
      tingkat_kesulitan: 'Sedang', bahasa: 'Bahasa Indonesia',
      yayasan: 'YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI',
      alamat_sekolah: 'Jl. Permata No. 19 Curug Gunungsindur Kab. Bogor 16340',
      logo_sekolah: '',
      judul_asesmen: 'PENILAIAN SUMATIF AKHIR SEMESTER GANJIL',
      tanggal_ujian: '',
      jam_ke: '', waktu_ujian: '90 Menit', use_thinking_mode: false,
      topik_ecourse: '', jumlah_pertemuan: 5,
    };
    try {
        const savedData = localStorage.getItem('guruAppData');
        if (savedData) return { ...defaultData, ...JSON.parse(savedData) };
    } catch (error) { console.error("Failed to load saved form data", error); }
    return defaultData;
  });
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [customMataPelajaran, setCustomMataPelajaran] = useState<Record<string, string[]>>({});
  const [newSubject, setNewSubject] = useState('');
  
  // Terminal Logs State
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const processedMilestones = useRef<Set<number>>(new Set());

  // Allow dynamic Pesantren form for 'Pesantren' jenjang regardless of language
  const showPesantrenDynamicForm = module === 'soal' && formData.jenjang === 'Pesantren';

  useEffect(() => {
    try {
        const savedCustomSubjects = localStorage.getItem('customMataPelajaran');
        if (savedCustomSubjects) {
            setCustomMataPelajaran(JSON.parse(savedCustomSubjects));
        }
    } catch (error) {
        console.error("Failed to load custom subjects from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('customMataPelajaran', JSON.stringify(customMataPelajaran));
    } catch (error) {
        console.error("Failed to save custom subjects to localStorage", error);
    }
  }, [customMataPelajaran]);


  useEffect(() => {
    try {
        const {
            sekolah, nama_guru, yayasan, alamat_sekolah, jenjang, kelas, mata_pelajaran, tahun_ajaran, bahasa, semester
        } = formData;
        const dataToSave = {
            sekolah, nama_guru, yayasan, alamat_sekolah, jenjang, kelas, mata_pelajaran, tahun_ajaran, bahasa, semester
        };
        localStorage.setItem('guruAppData', JSON.stringify(dataToSave));
    } catch (error) { 
        console.error("Failed to save form data", error); 
    }
  }, [formData.sekolah, formData.nama_guru, formData.yayasan, formData.alamat_sekolah, formData.jenjang, formData.kelas, formData.mata_pelajaran, formData.tahun_ajaran, formData.bahasa, formData.semester]);

  useEffect(() => {
    if (formData.jenjang) {
      setKelasOptions(KELAS_OPTIONS[formData.jenjang] || []);
      
      const baseSubjects = MATA_PELAJARAN_OPTIONS[formData.jenjang] || [];
      const customSubjectsForJenjang = customMataPelajaran[formData.jenjang] || [];
      const combinedSubjects = [...new Set([...baseSubjects, ...customSubjectsForJenjang])].sort();
      setMataPelajaranOptions(combinedSubjects);
      
      setAlokasiWaktuOptions(ALOKASI_WAKTU_OPTIONS[formData.jenjang] || []);
      
      const savedData = JSON.parse(localStorage.getItem('guruAppData') || '{}');
      if (savedData.jenjang !== formData.jenjang) {
        setFormData(prev => ({ ...prev, kelas: '', mata_pelajaran: '' }));
      }
      setShowCustomSubject(false);
    } else {
      setKelasOptions([]); setMataPelajaranOptions([]); setAlokasiWaktuOptions([]);
    }
  }, [formData.jenjang, customMataPelajaran]);
  
  useEffect(() => {
    setLogoPreview(null);
    setShowCustomSubject(false);
  }, [module]);

  useEffect(() => {
    const { jenjang, kelas } = formData;
    let newFase = '';
    const kelasNum = parseInt(kelas, 10);
    if (jenjang === 'SD' || jenjang === 'MI') {
        if (kelasNum <= 2) newFase = 'Fase A'; else if (kelasNum <= 4) newFase = 'Fase B'; else newFase = 'Fase C';
    } else if (jenjang === 'SMP' || jenjang === 'MTS') newFase = 'Fase D';
    else if (jenjang === 'SMA' || jenjang === 'MA') newFase = kelasNum === 10 ? 'Fase E' : 'Fase F';
    else if (jenjang === 'Pesantren') newFase = ''; // Clear fase for Pesantren
    
    if (newFase !== formData.fase) setFormData(prev => ({ ...prev, fase: newFase }));
  }, [formData.jenjang, formData.kelas]);

  // Terminal Log Logic
  useEffect(() => {
    if (!isLoading) {
        setLogs([]);
        processedMilestones.current.clear();
        return;
    }

    const steps = LOG_STEPS[module] || [];
    steps.forEach((step) => {
        if (generationProgress >= step.progress && !processedMilestones.current.has(step.progress)) {
            const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
            setLogs(prev => [...prev, `[${timestamp}] > ${step.message}`]);
            processedMilestones.current.add(step.progress);
        }
    });

  }, [isLoading, generationProgress, module]);

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [mataPelajaranOptions, setMataPelajaranOptions] = useState<string[]>([]);
  const [alokasiWaktuOptions, setAlokasiWaktuOptions] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
        setShowCustomSubject(true);
    } else {
        setShowCustomSubject(false);
        setFormData(prev => ({ ...prev, mata_pelajaran: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => {
      const newJenisSoal = checked ? [...(prev.jenis_soal || []), name] : (prev.jenis_soal || []).filter(item => item !== name);
      return { ...prev, jenis_soal: newJenisSoal };
    });
  };

  // --- NEW DYNAMIC PESANTREN SECTION HANDLERS ---
  const addPesantrenSection = () => {
    const isArabic = formData.bahasa === 'Bahasa Arab';
    const newSection: SoalPesantrenSection = {
        id: `section_${Date.now()}`,
        letter: isArabic ? 'Alif' : 'Bagian A',
        instruction: isArabic ? PESANTREN_INSTRUCTION_OPTIONS[0].value : 'Jawablah pertanyaan berikut!',
        count: 5,
    };
    setFormData(prev => ({
        ...prev,
        soal_pesantren_sections: [...(prev.soal_pesantren_sections || []), newSection]
    }));
  };

  const removePesantrenSection = (id: string) => {
    setFormData(prev => ({
        ...prev,
        soal_pesantren_sections: (prev.soal_pesantren_sections || []).filter(s => s.id !== id)
    }));
  };
  
  const handlePesantrenSectionChange = (id: string, field: keyof SoalPesantrenSection, value: string | number) => {
      setFormData(prev => ({
          ...prev,
          soal_pesantren_sections: (prev.soal_pesantren_sections || []).map(s => 
              s.id === id ? { ...s, [field]: value } : s
          )
      }));
  };
  // --- END ---
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFormData(prev => ({ ...prev, logo_sekolah: base64String }));
            setLogoPreview(base64String);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveNewSubject = () => {
    const trimmedSubject = newSubject.trim();
    if (trimmedSubject && formData.jenjang) {
        setCustomMataPelajaran(prev => {
            const subjectsForJenjang = prev[formData.jenjang] || [];
            if (subjectsForJenjang.includes(trimmedSubject) || (MATA_PELAJARAN_OPTIONS[formData.jenjang] || []).includes(trimmedSubject)) {
                return prev;
            }
            return {
                ...prev,
                [formData.jenjang]: [...subjectsForJenjang, trimmedSubject],
            };
        });
        setFormData(prev => ({ ...prev, mata_pelajaran: trimmedSubject }));
        setShowCustomSubject(false);
        setNewSubject('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDASI JUMLAH SOAL
    if (module === 'soal' && !showPesantrenDynamicForm) {
        const isPgSelected = formData.jenis_soal?.includes('Pilihan Ganda');
        const isUraianSelected = formData.jenis_soal?.includes('Uraian');
        const isIsianSelected = formData.jenis_soal?.includes('Isian Singkat');

        // Validasi minimal satu jenis soal dipilih
        if (!isPgSelected && !isUraianSelected && !isIsianSelected) {
             alert("Mohon pilih minimal satu jenis soal (Pilihan Ganda, Uraian, atau Isian Singkat).");
             return;
        }

        // Validasi Pilihan Ganda
        if (isPgSelected) {
            const pgCount = Number(formData.jumlah_pg) || 0;
            const tkaPgCount = formData.sertakan_soal_tka ? (Number(formData.jumlah_soal_tka) || 0) : 0;
            const totalPg = pgCount + tkaPgCount;
            
            if (totalPg <= 0) {
                alert("Jumlah soal Pilihan Ganda harus lebih dari 0.");
                return;
            }
        }

        // Validasi Uraian
        if (isUraianSelected) {
            const uraianCount = Number(formData.jumlah_uraian) || 0;
            const tkaUraianCount = formData.sertakan_soal_tka_uraian ? (Number(formData.jumlah_soal_tka_uraian) || 0) : 0;
            const totalUraian = uraianCount + tkaUraianCount;

            if (totalUraian <= 0) {
                alert("Jumlah soal Uraian harus lebih dari 0.");
                return;
            }
        }
        
         // Validasi Isian Singkat
        if (isIsianSelected) {
            if ((Number(formData.jumlah_isian_singkat) || 0) <= 0) {
                alert("Jumlah soal Isian Singkat harus lebih dari 0.");
                return;
            }
        }
    }

    onSubmit(formData);
  };

  const title = module === 'admin' ? 'Generator Administrasi Guru' : module === 'soal' ? 'Generator Bank Soal' : 'Generator E-Course';
  const description = module === 'admin' 
    ? 'Lengkapi form untuk menghasilkan ATP, Prota, Promes, Modul Ajar, KKTP, dan Jurnal Harian.' 
    : module === 'soal' 
    ? 'Lengkapi form untuk menghasilkan bank soal dan perangkat asesmen adaptif.'
    : 'Lengkapi form untuk menghasilkan silabus, materi, latihan, dan slide presentasi untuk e-course Anda.';
  const formElementClasses = "w-full rounded-md border-2 border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 ease-in-out";

  // Check if we are in Arabic language context for RTL/Letter selection
  const isArabicContext = formData.bahasa === 'Bahasa Arab';

  return (
    <div className="bg-white rounded-lg card-shadow p-6 fade-in">
      <div className="mb-6">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4">&larr; Kembali ke Dashboard</button>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Common Fields */}
        <div className="grid md:grid-cols-4 gap-6">
          <select id="jenjang" name="jenjang" value={formData.jenjang} onChange={handleChange} required className={formElementClasses} aria-label="Jenjang"><option value="">Pilih Jenjang</option><option>SD</option><option>MI</option><option>SMP</option><option>MTS</option><option>SMA</option><option>MA</option><option>Pesantren</option></select>
          <select id="kelas" name="kelas" value={formData.kelas} onChange={handleChange} required disabled={!formData.jenjang} className={`${formElementClasses} disabled:bg-gray-100`} aria-label="Kelas"><option value="">Pilih Kelas</option>{kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}</select>
          <select id="mata_pelajaran_select" name="mata_pelajaran_select" value={showCustomSubject ? 'custom' : formData.mata_pelajaran} onChange={handleSubjectChange} required disabled={!formData.jenjang} className={`${formElementClasses} disabled:bg-gray-100`} aria-label="Mata Pelajaran"><option value="">Pilih Mapel</option>{mataPelajaranOptions.map(m => <option key={m} value={m}>{m}</option>)}<option value="custom">Lainnya (Tambah Baru)...</option></select>
          <select id="bahasa" name="bahasa" value={formData.bahasa} onChange={handleChange} className={formElementClasses} aria-label="Bahasa"><option>Bahasa Indonesia</option><option>Bahasa Inggris</option><option>Bahasa Sunda</option><option>Bahasa Arab</option></select>
        </div>
        {showCustomSubject && (
            <div className="flex items-center space-x-2 mt-2">
                <input
                    type="text"
                    id="new_subject_input"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className={`flex-grow ${formElementClasses}`}
                    placeholder="Tulis nama mapel baru..."
                    aria-label="Mata Pelajaran Baru"
                />
                <button
                    type="button"
                    onClick={handleSaveNewSubject}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                    disabled={!newSubject.trim()}
                >
                    Simpan
                </button>
            </div>
        )}
        <div className="grid md:grid-cols-2 gap-6">
            <select id="semester" name="semester" value={formData.semester} onChange={handleChange} required className={formElementClasses} aria-label="Semester">
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
            </select>
            <input type="text" id="tahun_ajaran" name="tahun_ajaran" value={formData.tahun_ajaran} onChange={handleChange} required className={formElementClasses} placeholder="Tahun Ajaran" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <input type="text" id="sekolah" name="sekolah" value={formData.sekolah} onChange={handleChange} required className={formElementClasses} placeholder="Nama Sekolah" />
          <input type="text" id="nama_guru" name="nama_guru" value={formData.nama_guru} onChange={handleChange} required className={formElementClasses} placeholder="Nama Pengajar" />
        </div>
        <hr/>

        {module === 'ecourse' && (
            <div className="space-y-6">
                <textarea id="topik_ecourse" name="topik_ecourse" value={formData.topik_ecourse ?? ''} onChange={handleChange} required rows={3} className={formElementClasses} placeholder="Masukkan topik utama e-course..."></textarea>
                <div>
                    <label htmlFor="jumlah_pertemuan" className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pertemuan/Modul</label>
                    <input type="number" id="jumlah_pertemuan" name="jumlah_pertemuan" value={formData.jumlah_pertemuan} onChange={handleChange} required min="1" max="20" className={formElementClasses} placeholder="Jumlah Pertemuan" />
                </div>
            </div>
        )}

        {module === 'admin' && (
          <div className="space-y-6">
             <div className="grid md:grid-cols-3 gap-6">
                <select id="fase" name="fase" value={formData.fase} onChange={handleChange} required={formData.jenjang !== 'Pesantren'} disabled={formData.jenjang === 'Pesantren'} className={`${formElementClasses} bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed`}><option value="">{formData.jenjang === 'Pesantren' ? 'Tidak ada Fase' : 'Pilih Fase'}</option><option value="Fase A">Fase A (1-2 SD/MI)</option><option value="Fase B">Fase B (3-4 SD/MI)</option><option value="Fase C">Fase C (5-6 SD/MI)</option><option value="Fase D">Fase D (7-9 SMP/MTS)</option><option value="Fase E">Fase E (10 SMA/MA)</option><option value="Fase F">Fase F (11-12 SMA/MA)</option></select>
                <select id="alokasi_waktu" name="alokasi_waktu" value={formData.alokasi_waktu} onChange={handleChange} required disabled={!formData.jenjang} className={`${formElementClasses} disabled:bg-gray-100`}><option value="">Alokasi Waktu</option>{alokasiWaktuOptions.map(aw => <option key={aw} value={aw}>{aw}</option>)}</select>
                <input type="number" id="jumlah_modul_ajar" name="jumlah_modul_ajar" value={formData.jumlah_modul_ajar} onChange={handleChange} required min="1" max="20" className={formElementClasses} placeholder="Jumlah Modul Ajar" />
            </div>
            <textarea id="cp_elements" name="cp_elements" value={formData.cp_elements ?? ''} onChange={handleChange} required rows={4} className={formElementClasses} placeholder="Elemen Capaian Pembelajaran (CP)..."></textarea>
            <button type="button" onClick={() => onShowAIAssistant(formData, 'cp')} className="text-sm text-blue-600 font-semibold hover:underline">✨ Dapatkan saran dari AI Asisten</button>
          </div>
        )}
        
        {module === 'soal' && !showPesantrenDynamicForm && (
           <div className="space-y-6">
                <textarea id="topik_materi" name="topik_materi" value={formData.topik_materi ?? ''} onChange={handleChange} required rows={3} className={formElementClasses} placeholder="Topik / Materi..."></textarea>
                <button type="button" onClick={() => onShowAIAssistant(formData, 'topic')} className="text-sm text-blue-600 font-semibold hover:underline">✨ Dapatkan saran dari AI Asisten</button>
                <div className="flex space-x-4"><label><input type="checkbox" name="Pilihan Ganda" checked={formData.jenis_soal?.includes('Pilihan Ganda')} onChange={handleCheckboxChange}/> PG</label><label><input type="checkbox" name="Uraian" checked={formData.jenis_soal?.includes('Uraian')} onChange={handleCheckboxChange}/> Uraian</label><label><input type="checkbox" name="Isian Singkat" checked={formData.jenis_soal?.includes('Isian Singkat')} onChange={handleCheckboxChange}/> Isian</label></div>
                <div className="grid md:grid-cols-3 gap-6">
                    {formData.jenis_soal?.includes('Pilihan Ganda') && (
                        <div>
                            <label htmlFor="jumlah_pg" className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah PG
                                {formData.sertakan_soal_tka && <span className="text-indigo-600 font-bold ml-1">(+{formData.jumlah_soal_tka} TKA = {Number(formData.jumlah_pg || 0) + Number(formData.jumlah_soal_tka || 0)})</span>}
                            </label>
                            <input type="number" name="jumlah_pg" id="jumlah_pg" value={formData.jumlah_pg} onChange={handleChange} className={formElementClasses} placeholder="Jumlah PG" />
                        </div>
                    )}
                    {formData.jenis_soal?.includes('Uraian') && (
                        <div>
                            <label htmlFor="jumlah_uraian" className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Uraian
                                {formData.sertakan_soal_tka_uraian && <span className="text-indigo-600 font-bold ml-1">(+{formData.jumlah_soal_tka_uraian} TKA = {Number(formData.jumlah_uraian || 0) + Number(formData.jumlah_soal_tka_uraian || 0)})</span>}
                            </label>
                            <input type="number" name="jumlah_uraian" id="jumlah_uraian" value={formData.jumlah_uraian} onChange={handleChange} className={formElementClasses} placeholder="Jumlah Uraian" />
                        </div>
                    )}
                    {formData.jenis_soal?.includes('Isian Singkat') && (
                        <div>
                            <label htmlFor="jumlah_isian_singkat" className="block text-sm font-medium text-gray-700 mb-1">Jumlah Isian</label>
                            <input type="number" name="jumlah_isian_singkat" id="jumlah_isian_singkat" value={formData.jumlah_isian_singkat} onChange={handleChange} className={formElementClasses} placeholder="Jumlah Isian" />
                        </div>
                    )}
                </div>
                {['SMA', 'MA'].includes(formData.jenjang) && (
                  <div className="p-4 bg-indigo-50 border rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:space-x-6">
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="sertakan_soal_tka" checked={formData.sertakan_soal_tka} onChange={handleChange}/> 
                            <span>Tambah soal TKA Pilihan Ganda</span>
                        </label>
                        <label className="flex items-center space-x-2 mt-2 sm:mt-0">
                            <input type="checkbox" name="sertakan_soal_tka_uraian" checked={formData.sertakan_soal_tka_uraian} onChange={handleChange}/> 
                            <span>Tambah soal TKA Uraian</span>
                        </label>
                    </div>
                    
                    {(formData.sertakan_soal_tka || formData.sertakan_soal_tka_uraian) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                            {formData.sertakan_soal_tka && 
                                <div>
                                    <label htmlFor="jumlah_soal_tka" className="text-xs font-medium text-gray-600">Jumlah TKA PG</label>
                                    <input type="number" name="jumlah_soal_tka" id="jumlah_soal_tka" value={formData.jumlah_soal_tka} onChange={handleChange} className={formElementClasses} placeholder="Jml TKA PG" />
                                </div>
                            }
                            {formData.sertakan_soal_tka_uraian &&
                                <div>
                                    <label htmlFor="jumlah_soal_tka_uraian" className="text-xs font-medium text-gray-600">Jumlah TKA Uraian</label>
                                    <input type="number" name="jumlah_soal_tka_uraian" id="jumlah_soal_tka_uraian" value={formData.jumlah_soal_tka_uraian} onChange={handleChange} className={formElementClasses} placeholder="Jml TKA Uraian" />
                                </div>
                            }
                            <div>
                                <label htmlFor="kelompok_tka" className="text-xs font-medium text-gray-600">Kelompok TKA</label>
                                <select id="kelompok_tka" name="kelompok_tka" value={formData.kelompok_tka} onChange={handleChange} className={formElementClasses}>
                                    <option value="saintek">SAINTEK</option>
                                    <option value="soshum">SOSHUM</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                )}
                <div className="grid md:grid-cols-2 gap-6">
                    <select name="tingkat_kesulitan" value={formData.tingkat_kesulitan} onChange={handleChange} className={formElementClasses}><option>Mudah</option><option>Sedang</option><option>Sulit (HOTS)</option></select>
                </div>
           </div>
        )}

        {showPesantrenDynamicForm && (
            <div className="space-y-6">
                <textarea id="topik_materi" name="topik_materi" value={formData.topik_materi ?? ''} onChange={handleChange} required rows={3} className={formElementClasses} placeholder="Topik / Materi (contoh: I'rab, Tashrif, Adad Ma'dud)..."></textarea>
                <button type="button" onClick={() => onShowAIAssistant(formData, 'topic')} className="text-sm text-blue-600 font-semibold hover:underline">✨ Dapatkan saran dari AI Asisten</button>
                
                <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                    <h3 className="font-semibold text-gray-800">
                        {isArabicContext ? 'Pembangun Bagian Soal (Berbahasa Arab)' : 'Pembangun Bagian Soal (Format Pesantren)'}
                    </h3>
                    {(formData.soal_pesantren_sections || []).map((section) => {
                        // Check if current instruction is in the presets
                        const isCustomInstruction = isArabicContext 
                            ? !PESANTREN_INSTRUCTION_OPTIONS.some(opt => opt.value === section.instruction)
                            : true; // Always custom input for non-Arabic, unless we map presets

                        return (
                            <div key={section.id} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
                                <select
                                    value={section.letter}
                                    onChange={(e) => handlePesantrenSectionChange(section.id, 'letter', e.target.value)}
                                    className={`${formElementClasses} w-full md:w-auto font-mono`}
                                >
                                    {isArabicContext 
                                        ? PESANTREN_SOAL_LETTERS.map(l => <option key={l} value={l}>{l}</option>)
                                        : PESANTREN_SOAL_LETTERS_LATIN.map(l => <option key={l} value={`Bagian ${l}`}>{l}</option>)
                                    }
                                </select>

                                <div className="flex-grow w-full">
                                    {isArabicContext ? (
                                        <>
                                            <select
                                                value={isCustomInstruction ? 'custom' : section.instruction}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    handlePesantrenSectionChange(section.id, 'instruction', value === 'custom' ? '' : value);
                                                }}
                                                className={`${formElementClasses} w-full`}
                                            >
                                                {PESANTREN_INSTRUCTION_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.text} {opt.value !== 'custom' && `— ${opt.value}`}
                                                    </option>
                                                ))}
                                            </select>

                                            {isCustomInstruction && (
                                                <input
                                                    type="text"
                                                    value={section.instruction}
                                                    placeholder="اكتب الأمر هنا..."
                                                    onChange={(e) => handlePesantrenSectionChange(section.id, 'instruction', e.target.value)}
                                                    className={`mt-2 ${formElementClasses} arabic-font-preview w-full`}
                                                    style={{ textAlign: 'right' }}
                                                    required
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            value={section.instruction}
                                            placeholder="Tulis instruksi soal di sini..."
                                            onChange={(e) => handlePesantrenSectionChange(section.id, 'instruction', e.target.value)}
                                            className={`${formElementClasses} w-full`}
                                            required
                                        />
                                    )}
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <label htmlFor={`count-${section.id}`} className="text-sm font-medium text-gray-600">Jumlah:</label>
                                    <input
                                        id={`count-${section.id}`}
                                        type="number"
                                        value={section.count}
                                        min="1"
                                        onChange={(e) => handlePesantrenSectionChange(section.id, 'count', parseInt(e.target.value, 10) || 1)}
                                        className={`${formElementClasses} w-20 text-center`}
                                        required
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removePesantrenSection(section.id)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                    title="Hapus Bagian"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )
                    })}
                    <button type="button" onClick={addPesantrenSection} className="w-full mt-2 px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-md hover:bg-blue-200">+ Tambah Bagian Soal</button>
                </div>

                
                <div className="grid md:grid-cols-2 gap-6">
                    <select name="tingkat_kesulitan" value={formData.tingkat_kesulitan} onChange={handleChange} className={formElementClasses}><option>Mudah</option><option>Sedang</option><option>Sulit (HOTS)</option></select>
                </div>
           </div>
        )}
        
        {module === 'soal' && (
            <>
            <hr/>
            <h3 className="text-lg font-medium">Kustomisasi Header Soal</h3>
            <input type="file" id="logo_sekolah" name="logo_sekolah" accept="image/*" onChange={handleLogoChange} className="text-sm" />
            <div className="grid md:grid-cols-2 gap-6"><input type="text" name="yayasan" value={formData.yayasan} onChange={handleChange} className={formElementClasses} placeholder="Nama Yayasan"/><input type="text" name="alamat_sekolah" value={formData.alamat_sekolah} onChange={handleChange} className={formElementClasses} placeholder="Alamat Sekolah"/></div>
            </>
        )}

        <div className="p-4 bg-gray-100 rounded-lg flex items-center justify-between">
            <div className="form-control">
                <label className="cursor-pointer label">
                    <span className="label-text font-semibold text-gray-700 mr-2">🧠 Mode Cerdas (HOTS & Analisis Mendalam)</span> 
                    <input type="checkbox" name="use_thinking_mode" checked={!!formData.use_thinking_mode} onChange={handleChange} className="toggle toggle-primary" />
                </label>
            </div>
            <p className="text-xs text-gray-500">Menggunakan model AI yang lebih kuat untuk hasil yang lebih komprehensif. <br/>Proses generate mungkin sedikit lebih lama.</p>
        </div>

        {isLoading && (
            <div className="my-4">
                <div className="flex justify-between mb-1">
                    <span className="font-medium text-indigo-700">AI Sedang Bekerja... (Estimasi: 1-5 menit)</span>
                    <span className="font-medium text-indigo-700">{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${generationProgress}%` }}></div>
                </div>

                {/* Terminal Log View */}
                <div className="bg-gray-900 rounded-md p-4 h-48 overflow-y-auto font-mono text-sm border-l-4 border-indigo-500 shadow-inner">
                    <div className="flex flex-col space-y-1">
                        {logs.map((log, index) => (
                            <p key={index} className="text-green-400">
                                {log}
                            </p>
                        ))}
                        <div ref={logsEndRef} />
                        <div className="flex items-center text-green-400 mt-2">
                            <span className="mr-1">{'>'}</span>
                            <span className="w-2 h-4 bg-green-400 animate-pulse inline-block"></span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-end pt-2">
            <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center px-6 py-2 border rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                {isLoading ? <><Spinner /><span className="ml-2">Generating...</span></> : 'Generate Perangkat'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default GeneratorForm;
