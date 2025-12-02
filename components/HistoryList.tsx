import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onView: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onView, onDelete }) => {
  const getModuleInfo = (item: HistoryItem) => {
    switch (item.module_type) {
        case 'admin':
            return { label: 'Administrasi', color: 'bg-blue-100 text-blue-800' };
        case 'soal':
            return { label: 'Bank Soal', color: 'bg-green-100 text-green-800' };
        case 'ecourse':
            return { label: 'E-Course', color: 'bg-yellow-100 text-yellow-800' };
        default:
            return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="bg-white rounded-lg card-shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Generator</h2>
      <div id="history-list" className="space-y-4">
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada riwayat generator. Mulai buat perangkat pertama Anda!</p>
        ) : (
          history.map(item => {
            const moduleInfo = getModuleInfo(item);
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${moduleInfo.color}`}>
                      {moduleInfo.label}
                    </span>
                    <span className="text-sm font-medium">
                      {item.mata_pelajaran ? `${item.mata_pelajaran} - Kelas ${item.kelas}` : (item.topik_ecourse || 'E-Course')}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onView(item)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Lihat</button>
                    <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Sekolah:</strong> {item.sekolah}</p>
                   {item.module_type === 'soal' && (
                      <>
                        {item.topik_materi && <p className="text-xs pt-1"><strong>Topik:</strong> {item.topik_materi}</p>}
                        <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-4 gap-y-1 pt-1">
                          {item.sertakan_kisi_kisi && <span className="font-semibold text-indigo-600">[+ Kisi-kisi]</span>}
                          {item.sertakan_soal_tka && item.jumlah_soal_tka && (
                              <span className="font-semibold text-purple-600">[+{item.jumlah_soal_tka} Soal TKA-PG]</span>
                          )}
                          {item.sertakan_soal_tka_uraian && item.jumlah_soal_tka_uraian && (
                              <span className="font-semibold text-pink-600">[+{item.jumlah_soal_tka_uraian} Soal TKA-Uraian]</span>
                          )}
                          <span><strong>Bahasa:</strong> {item.bahasa}</span>
                          {item.jenis_soal && !item.soal_pesantren_sections?.length && <span><strong>Jenis:</strong> {item.jenis_soal.join(', ')}</span>}
                          {item.jenis_soal?.includes('Pilihan Ganda') && <span><strong>PG:</strong> {item.jumlah_pg}</span>}
                          {item.jenis_soal?.includes('Uraian') && <span><strong>Uraian:</strong> {item.jumlah_uraian}</span>}
                          {item.jenis_soal?.includes('Isian Singkat') && <span><strong>Isian:</strong> {item.jumlah_isian_singkat}</span>}
                          {item.soal_pesantren_sections && item.soal_pesantren_sections.length > 0 && (
                            <span><strong>Bagian:</strong> {item.soal_pesantren_sections.map(s => `${s.letter}: ${s.count}`).join(', ')}</span>
                          )}
                        </div>
                      </>
                  )}
                   {item.module_type === 'admin' && (
                    <>
                      <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-4 gap-y-1 pt-1">
                        <span><strong>Bahasa:</strong> {item.bahasa}</span>
                        {item.jumlah_modul_ajar && <span><strong>Modul Ajar:</strong> {item.jumlah_modul_ajar}</span>}
                      </div>
                      {item.generated_sections && (
                        <p className="text-xs text-gray-500 pt-1">
                          <strong>Bagian:</strong> {item.generated_sections.map(s => s.title).join(', ')}
                        </p>
                      )}
                    </>
                  )}
                  {item.module_type === 'ecourse' && (
                    <>
                      {item.topik_ecourse && <p className="text-xs pt-1"><strong>Topik E-Course:</strong> {item.topik_ecourse}</p>}
                       <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-4 gap-y-1 pt-1">
                        {item.jumlah_pertemuan && <span><strong>Jumlah Pertemuan:</strong> {item.jumlah_pertemuan}</span>}
                       </div>
                    </>
                  )}
                  <p className="text-xs pt-1"><strong>Dibuat:</strong> {new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default HistoryList;
