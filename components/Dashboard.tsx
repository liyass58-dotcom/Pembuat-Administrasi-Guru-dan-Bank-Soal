
import React from 'react';
import { Module, View } from '../types';

interface DashboardProps {
  onModuleSelect: (module: Module | View) => void;
  onStartTour: () => void;
}

const modules = [
  {
    id: 'admin',
    title: 'Generator Administrasi Guru',
    description: 'ATP, Prota, Promes, Modul Ajar, KKTP, & Jurnal Harian.',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ),
    color: 'blue',
  },
  {
    id: 'soal',
    title: 'Generator Bank Soal',
    description: 'Bank soal adaptif, kisi-kisi, & rubrik penilaian.',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
      </svg>
    ),
    color: 'green',
  },
  {
    id: 'ecourse',
    title: 'Generator E-Course',
    description: 'Silabus, materi, latihan, evaluasi, & slide presentasi.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.394 2.08a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
      </svg>
    ),
    color: 'yellow',
  },
  {
    id: 'audioLab',
    title: 'Lab Audio & Percakapan',
    description: 'Percakapan real-time dengan AI & transkripsi audio.',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V14a1 1 0 10-2 0v.93a7 7 0 00-5 6.47A1 1 0 005 22h10a1 1 0 00.997-1.47A7 7 0 0011 14.93z" clipRule="evenodd" /></svg>
    ),
    color: 'teal',
  },
  {
    id: 'groundedSearch',
    title: 'Pencarian Cerdas',
    description: 'Dapatkan jawaban akurat dari web & peta terkini.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
    ),
    color: 'pink',
  },
  {
    id: 'documentation',
    title: 'Dokumentasi & Panduan',
    description: 'Pelajari cara menggunakan aplikasi ini secara lengkap.',
    color: 'purple',
    url: '#', // Placeholder for documentation link
  },
  {
    id: 'ebook',
    title: 'Perpustakaan Digital',
    description: 'Akses ribuan buku digital resmi dari Kemendikbud.',
    color: 'orange',
    url: 'https://buku.kemendikdasmen.go.id/',
  },
  {
    id: 'quran',
    title: "Al-Qur'an Digital",
    description: "Akses Al-Qur'an digital lengkap dari Kemenag.",
    color: 'indigo',
    url: 'https://quran.kemenag.go.id/',
  },
  {
    id: 'hadits',
    title: "Hadits Digital",
    description: "Akses koleksi hadits lengkap dari Hadits.id.",
    color: 'cyan',
    url: 'https://www.hadits.id/',
  },
  {
    id: 'perpusnas',
    title: 'Perpustakaan Nasional',
    description: 'Jelajahi koleksi buku baru dari Perpusnas RI.',
    color: 'gray',
    url: 'https://www.perpusnas.go.id/buku-baru',
  }
];

const colorClasses = {
    blue: { bg: 'bg-blue-500', border: 'border-blue-200', hoverBg: 'hover:bg-blue-50', hoverBorder: 'hover:border-blue-500' },
    green: { bg: 'bg-green-500', border: 'border-green-200', hoverBg: 'hover:bg-green-50', hoverBorder: 'hover:border-green-500' },
    yellow: { bg: 'bg-yellow-500', border: 'border-yellow-200', hoverBg: 'hover:bg-yellow-50', hoverBorder: 'hover:border-yellow-500' },
    teal: { bg: 'bg-teal-500', border: 'border-teal-200', hoverBg: 'hover:bg-teal-50', hoverBorder: 'hover:border-teal-500' },
    pink: { bg: 'bg-pink-500', border: 'border-pink-200', hoverBg: 'hover:bg-pink-50', hoverBorder: 'hover:border-pink-500' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-200', hoverBg: 'hover:bg-purple-50', hoverBorder: 'hover:border-purple-500' },
    red: { bg: 'bg-red-500', border: 'border-red-200', hoverBg: 'hover:bg-red-50', hoverBorder: 'hover:border-red-500' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-200', hoverBg: 'hover:bg-orange-50', hoverBorder: 'hover:border-orange-500' },
    indigo: { bg: 'bg-indigo-500', border: 'border-indigo-200', hoverBg: 'hover:bg-indigo-50', hoverBorder: 'hover:border-indigo-500' },
    cyan: { bg: 'bg-cyan-500', border: 'border-cyan-200', hoverBg: 'hover:bg-cyan-50', hoverBorder: 'hover:border-cyan-500' },
    gray: { bg: 'bg-gray-500', border: 'border-gray-200', hoverBg: 'hover:bg-gray-50', hoverBorder: 'hover:border-gray-500' }
}

const BookmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
);


const Dashboard: React.FC<DashboardProps> = ({ onModuleSelect, onStartTour }) => {
  const generatorModules = modules.filter(m => !('url' in m));
  const externalLinks = modules.filter(m => 'url' in m);

  return (
    <div className="fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Selamat Datang di Toolkit AI Guru</h2>
        <p className="mt-2 text-xl font-semibold text-gray-800">Lembaga Penjaminan Mutu Pendidikan (LPMP)</p>
        <p className="mt-1 text-lg text-gray-700">YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI</p>
        <p className="mt-4 text-lg text-gray-600">
          Pilih salah satu alat canggih di bawah ini untuk memulai.
        </p>
        <div className="mt-6 flex justify-center">
             <button onClick={onStartTour} className="flex items-center px-5 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium hover:bg-indigo-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Lihat Panduan / Tur Aplikasi
             </button>
        </div>
      </div>

      {/* --- Main Generator Modules --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {generatorModules.map((mod: any) => {
          const colors = colorClasses[mod.color as keyof typeof colorClasses];
          const isFeatured = mod.isFeatured;
          const commonClasses = `module-btn p-6 border-2 ${colors.border} rounded-lg ${colors.hoverBorder} ${colors.hoverBg} transition-all duration-200 text-left flex flex-col items-start card-shadow`;
          const featuredClasses = isFeatured ? 'md:col-span-2 lg:col-span-4' : '';

          return (
            <button
              id={`tour-step-${mod.id}`}
              key={mod.id}
              onClick={() => onModuleSelect(mod.id as any)}
              className={`${commonClasses} ${featuredClasses}`}
            >
              <div className="flex items-center mb-3 w-full">
                <div className={`w-16 h-16 ${colors.bg} rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}>
                  {mod.icon}
                </div>
                <div>
                  <h3 className={`font-semibold text-gray-900 ${isFeatured ? 'text-2xl' : 'text-xl'}`}>{mod.title}</h3>
                   {isFeatured && <span className="text-xs font-bold bg-yellow-300 text-yellow-800 px-2 py-0.5 rounded-full">FITUR UNGGULAN</span>}
                </div>
              </div>
              <p className="text-gray-600">{mod.description}</p>
            </button>
          )
        })}
      </div>

      {/* --- External Resources Section --- */}
      <div className="mt-16">
        <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800">Sumber Belajar Digital & Referensi</h3>
            <p className="mt-1 text-md text-gray-600">Akses cepat ke sumber daya pendidikan eksternal.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {externalLinks.map(link => {
                const colors = colorClasses[link.color as keyof typeof colorClasses];
                // Render placeholder link or real link
                return (
                    <a
                        href={link.url}
                        target={link.url === '#' ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        id={`tour-step-${link.id}`}
                        key={link.id}
                        onClick={(e) => {
                            if (link.url === '#') {
                                e.preventDefault();
                                alert('Dokumentasi belum tersedia secara eksternal. Silakan gunakan tombol "Lihat Panduan / Tur Aplikasi" di bagian atas.');
                            }
                        }}
                        className={`group flex items-center p-4 border-2 rounded-lg transition-all duration-200 card-shadow ${colors.border} ${colors.hoverBorder} ${colors.hoverBg}`}
                    >
                        {link.id === 'documentation' ? (
                            <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mr-4`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                </svg>
                            </div>
                        ) : (
                            <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mr-4`}>
                                <BookmarkIcon />
                            </div>
                        )}
                        <div className="flex-grow">
                            <h4 className="font-semibold text-gray-800">{link.title}</h4>
                            <p className="text-sm text-gray-500 hidden sm:block">{link.description}</p>
                        </div>
                        <div className="ml-4 text-gray-400 group-hover:text-gray-600 transition-colors">
                            <ExternalLinkIcon />
                        </div>
                    </a>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
