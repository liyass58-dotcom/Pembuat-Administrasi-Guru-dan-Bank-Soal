import React, { useState, useEffect } from 'react';
import { GeneratedSection, Module, FormData } from '../types';
import { ARABIC_SUBJECTS } from '../constants';
import { textToSpeech } from '../services/geminiService';

const downloadDoc = (fileName: string, content: string, formData: FormData | null) => {
    // Strict check: RTL is applied only if the chosen language is 'Bahasa Arab'.
    // This allows Indonesian language exams for Islamic subjects to remain LTR.
    const isArabicContext = formData?.bahasa === 'Bahasa Arab';

    // Set a smaller font size to ensure content fits portrait legal paper
    const fontAndDirectionStyles = isArabicContext 
        ? `body { font-family: 'Times New Roman', serif; direction: rtl; font-size: 10pt; }` 
        : `body { font-family: 'Times New Roman', serif; direction: ltr; font-size: 10pt; }`;

    const styles = `
        @page WordSection1 {
            size: 8.5in 14.0in; /* US Legal, Portrait */
            margin: 1.5cm;
            mso-header-margin:.5in;
            mso-footer-margin:.5in;
            mso-paper-source:0;
        }
        div.WordSection1 {
            page: WordSection1;
        }
        ${fontAndDirectionStyles}
        table {
            border-collapse: collapse;
            width: 100%;
            table-layout: auto;
        }
        th, td {
            border: 1px solid black;
            padding: 4px; /* Reduced padding */
            text-align: left;
            vertical-align: top;
            word-wrap: break-word; /* Ensure long text wraps */
            overflow-wrap: break-word;
        }
        th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
        }
        h1, h2, h3, h4 {
            font-family: 'Arial', sans-serif;
            page-break-after: avoid;
        }
        /* Specific alignment for Arabic text in tables */
        ${isArabicContext ? `th, td { text-align: right; }` : ''}
    `;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${fileName}</title>
            <style>${styles}</style>
        </head>
        <body>
            <div class="WordSection1 ${isArabicContext ? 'arabic-font-preview' : ''}">
    `;
    const footer = "</div></body></html>";
    const sourceHTML = header + content + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${fileName}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
};

interface ResultsDisplayProps {
  module: Module;
  sections: GeneratedSection[];
  formData: FormData;
  onUpdateSectionContent: (id: string, newContent: string) => void;
  onDeleteSection: (id: string) => void;
  onNewGeneration: () => void;
  onBack: () => void;
  onSaveSession: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ module, sections, formData, onUpdateSectionContent, onDeleteSection, onNewGeneration, onBack, onSaveSession }) => {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));
  const [audioState, setAudioState] = useState<{ isPlaying: boolean; sectionId: string | null; audioContext: AudioContext | null; source: AudioBufferSourceNode | null }>({ isPlaying: false, sectionId: null, audioContext: null, source: null });
  const [isAudioFeatureDisabled, setIsAudioFeatureDisabled] = useState(false);

  useEffect(() => {
    setSelectedSections(new Set(sections.map(s => s.id)));
  }, [sections]);

  const handleSelectionChange = (sectionId: string) => {
    setSelectedSections(prev => {
        const newSelection = new Set(prev);
        newSelection.has(sectionId) ? newSelection.delete(sectionId) : newSelection.add(sectionId);
        return newSelection;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.checked ? setSelectedSections(new Set(sections.map(s => s.id))) : setSelectedSections(new Set());
  };

  const handleDownloadSelected = () => {
    const sectionsToDownload = sections.filter(s => selectedSections.has(s.id));
    if (sectionsToDownload.length === 0) return;
    const fullContent = sectionsToDownload.map(s => `<h2>${s.title}</h2>${s.content}`).join(module === 'admin' ? '<br style="page-break-after: always;">' : '');
    downloadDoc(`${formData.mata_pelajaran}_Kelas_${formData.kelas}_Pilihan`, fullContent, formData);
  };

  const handleDownloadSingle = (section: GeneratedSection) => {
    downloadDoc(
        `${formData.mata_pelajaran}_${section.title.replace(/ /g, '_')}`, 
        `<h2>${section.title}</h2>${section.content}`, 
        formData
    );
  };
  
  const handlePlayAudio = async (section: GeneratedSection) => {
    if (isAudioFeatureDisabled) return;

    if (audioState.isPlaying && audioState.sectionId === section.id) {
        audioState.source?.stop();
        audioState.audioContext?.close();
        setAudioState({ isPlaying: false, sectionId: null, audioContext: null, source: null });
        return;
    }
    
    // Stop any currently playing audio
    if (audioState.source) {
        audioState.source.stop();
        audioState.audioContext?.close();
    }
    
    setAudioState({ isPlaying: true, sectionId: section.id, audioContext: null, source: null });
    
    try {
        const plainText = new DOMParser().parseFromString(section.content, 'text/html').body.textContent || '';
        const audioBuffer = await textToSpeech(`${section.title}. ${plainText}`);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
            setAudioState({ isPlaying: false, sectionId: null, audioContext: null, source: null });
            audioContext.close();
        };
        source.start();
        setAudioState({ isPlaying: true, sectionId: section.id, audioContext, source });
    } catch (error: any) {
        const errorMessage = error.toString();
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            console.warn("TTS quota exceeded. Disabling audio playback for this session.");
            setIsAudioFeatureDisabled(true);
        } else {
            console.error("TTS Error:", error);
        }
        setAudioState({ isPlaying: false, sectionId: null, audioContext: null, source: null });
    }
  };

  const isAllSelected = sections.length > 0 && selectedSections.size === sections.length;

  return (
    <div id="results-section" className="bg-white rounded-lg card-shadow p-6 fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
            <button onClick={onBack} className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2">&larr; Kembali ke Dashboard</button>
            <h2 className="text-2xl font-bold text-gray-900">Hasil Generator (Dapat Diedit)</h2>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button onClick={onSaveSession} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">💾 Simpan Sesi</button>
          <button onClick={handleDownloadSelected} disabled={selectedSections.size === 0} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">📥 Download Pilihan ({selectedSections.size})</button>
          <button onClick={onNewGeneration} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">➕ Generate Baru</button>
        </div>
      </div>
      
      <div className="mb-4 border-b pb-4">
        <label className="inline-flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-5 w-5 rounded"/><span>{isAllSelected ? 'Hapus Pilihan' : 'Pilih Semua'}</span></label>
      </div>

      <div id="generated-content">
        {sections.map(section => (
          <div key={section.id} className="flex items-start space-x-3 mb-4 group">
            <input type="checkbox" aria-label={`Pilih ${section.title}`} checked={selectedSections.has(section.id)} onChange={() => handleSelectionChange(section.id)} className="h-6 w-6 rounded mt-1"/>
            <div className="flex-grow relative p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-200">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <button 
                        onClick={() => handlePlayAudio(section)} 
                        title={isAudioFeatureDisabled ? "Fitur audio dinonaktifkan karena kuota terlampaui" : "Dengarkan Teks"} 
                        disabled={isAudioFeatureDisabled}
                        className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {audioState.isPlaying && audioState.sectionId === section.id ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>}
                    </button>
                    <button onClick={() => handleDownloadSingle(section)} title="Download Bagian Ini" className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => onDeleteSection(section.id)} title="Hapus Bagian" className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{section.title}</h3>
                <div className="prose max-w-none focus:outline-none" contentEditable suppressContentEditableWarning={true} onBlur={e => onUpdateSectionContent(section.id, e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;