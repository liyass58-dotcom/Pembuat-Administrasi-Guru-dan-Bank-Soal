

import React from 'react';
import { ActivityLogItem, Module } from '../types';

interface ActivityLogProps {
  logs: ActivityLogItem[];
}

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";
    return "Baru saja";
};


const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  // FIX: Use React.ReactElement instead of JSX.Element to avoid issues with the global JSX namespace.
  const getModuleInfo = (module_type: Module): { icon: React.ReactElement; label: string } => {
    switch (module_type) {
      case 'admin':
        return {
          label: 'Administrasi',
          icon: (
            <div className="bg-blue-500 p-2 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
          ),
        };
      case 'soal':
        return {
          label: 'Bank Soal',
          icon: (
            <div className="bg-green-500 p-2 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
          ),
        };
       case 'ecourse':
        return {
          label: 'E-Course',
          icon: (
             <div className="bg-yellow-500 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
             </div>
          ),
        };
      default:
         return {
          label: 'Aktivitas',
          icon: (
            <div className="bg-gray-500 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            </div>
          ),
        };
    }
  };

  return (
    <div className="bg-white rounded-lg card-shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Aktivitas Pengguna Terkini</h2>
      <div id="activity-log-list" className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada aktivitas. Generate perangkat untuk memulai pencatatan.</p>
        ) : (
          logs.map(log => {
            const moduleInfo = getModuleInfo(log.module_type);
            return (
              <div key={log.id} className="flex items-start space-x-4 fade-in">
                {moduleInfo.icon}
                <div className="flex-grow">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{log.user}</span> telah meng-generate {' '}
                    <span className="font-semibold">{moduleInfo.label}</span>
                  </p>
                  <p className="text-xs text-gray-500">{log.details}</p>
                   <p className="text-xs text-gray-400 mt-1">{timeAgo(log.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
