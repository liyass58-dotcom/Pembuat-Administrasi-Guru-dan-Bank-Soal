
import { GoogleGenAI, Modality, Type, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { FormData, GeneratedSection, GroundingSource } from "../types";
import { ARABIC_SUBJECTS } from "../constants";

// Helper function to safely get the API Key in various environments
const getApiKey = (): string => {
    // 1. Try standard process.env (Node/Webpack)
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
    } catch (e) {}

    // 2. Try Vite-style import.meta.env
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
            // @ts-ignore
            return import.meta.env.VITE_API_KEY;
        }
    } catch (e) {}
    
    // 3. Try React App style
    try {
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_KEY) {
            return process.env.REACT_APP_API_KEY;
        }
    } catch (e) {}

    // Return empty string if not found, let getAiClient handle the error
    return "";
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key tidak ditemukan. Pastikan Environment Variable 'API_KEY' sudah diatur di Netlify (Site Settings > Environment variables).");
    }
    return new GoogleGenAI({ apiKey });
};


// NEW: Base64 encoded image for the Pesantren exam header
const PESANTREN_HEADER_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAADIBAMAAABN/C3bAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJUExURQAAABRFFBRAFA232JIAAAABdFJOUwBA5thmAAADOUlEQVR42u3bQXLCQBSA4c9/d8gBQXKBEa5AnXv0/29AEEj20sDsfm0rAAAAAADgC4Xn9drPa55A2Z/XfK75hR8AAMAfGk5QsoToitQf/f6g7g8EAAAA/BdhA8QGEJvFbv/m9QTm5QIAAAAAgGlhAcQGEBsAANBkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkqwBiA4gNAADg5d4FiA0gNoAAgHawAUQGEBsAANCkq';

// Define a reusable schema for structured JSON output to improve reliability
const sectionsSchema = {
    type: Type.OBJECT,
    properties: {
        sections: {
            type: Type.ARRAY,
            description: "An array of generated document sections.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique identifier for the section (e.g., 'atp', 'naskah_soal')." },
                    title: { type: Type.STRING, description: "The title of the generated section." },
                    content: { type: Type.STRING, description: "The full HTML content of the section." },
                },
                required: ['id', 'title', 'content'],
            },
        },
    },
    required: ['sections'],
};

// ROBUST JSON PARSER HELPER
const cleanAndParseJson = (text: string): any => {
    if (!text) throw new Error("Respon AI kosong.");

    let cleanText = text.trim();
    
    // 1. Remove Markdown code blocks if present
    cleanText = cleanText.replace(/```json|```/g, '');
    
    // 2. Aggressively find the JSON object/array start and end
    // This ignores any conversational filler text before or after the JSON
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    } else {
        // Fallback: Try array format if object format fails
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }
    }

    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", text);
        console.error("Attempted to parse:", cleanText);
        throw new Error("Gagal memproses format data dari AI. Silakan coba generate ulang.");
    }
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error.toString().toLowerCase().includes('503') || error.toString().toLowerCase().includes('unavailable') || error.toString().toLowerCase().includes('overloaded'))) {
            console.warn(`Model overloaded. Retrying... attempts left: ${retries}`);
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

export const getCPSuggestions = async (formData: Partial<FormData>): Promise<string> => {
    const ai = getAiClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Buat daftar Elemen Capaian Pembelajaran (CP) untuk mata pelajaran ${formData.mata_pelajaran}, jenjang ${formData.jenjang}, kelas ${formData.kelas}, fase ${formData.fase}. Sajikan dalam format Markdown dengan poin-poin.`,
    }));
    return response.text;
};

export const getTopicSuggestions = async (formData: Partial<FormData>): Promise<string> => {
    const ai = getAiClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Berikan daftar ide Topik/Materi Pembelajaran yang relevan untuk mata pelajaran ${formData.mata_pelajaran}, jenjang ${formData.jenjang}, kelas ${formData.kelas}, fase ${formData.fase} untuk semester ${formData.semester}. Sajikan dalam format Markdown dengan poin-poin.`,
    }));
    return response.text;
};

export const generateAdminContent = async (formData: FormData): Promise<GeneratedSection[]> => {
    const ai = getAiClient();
    
    const harakatInstruction = formData.bahasa === 'Bahasa Arab' 
        ? "**INSTRUKSI KHUSUS BAHASA ARAB: Seluruh teks Arab (Ayat Al-Qur'an, Hadits, atau teks materi) WAJIB MENGGUNAKAN HARAKAT LENGKAP (FULL TASHKEEL).**"
        : "";

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Anda adalah asisten ahli untuk guru di Indonesia. Buatkan dokumen administrasi guru lengkap sesuai Kurikulum Merdeka.
        **Data:**
        - Jenjang: ${formData.jenjang}
        - Kelas: ${formData.kelas}
        - Fase: ${formData.fase}
        - Mata Pelajaran: ${formData.mata_pelajaran}
        - Elemen CP: ${formData.cp_elements}
        - Alokasi Waktu: ${formData.alokasi_waktu}
        - Jumlah Modul Ajar yang dibuat: ${formData.jumlah_modul_ajar}
        - Sekolah: ${formData.sekolah}
        - Guru: ${formData.nama_guru}
        - Tahun Ajaran: ${formData.tahun_ajaran}
        - Semester: ${formData.semester === '1' ? 'Ganjil' : 'Genap'}
        - Bahasa: ${formData.bahasa}
        
        **Tugas:**
        Generate paket administrasi yang WAJIB terdiri dari **6 (ENAM) DOKUMEN LENGKAP** berikut dalam format JSON. Jangan melewatkan satu pun.
        
        1.  **Analisis CP, TP, dan ATP**: Buat tabel ATP yang runut dengan kolom-kolom: 'Elemen', 'Capaian Pembelajaran', 'Tujuan Pembelajaran (TP)', 'Alur Tujuan Pembelajaran (ATP)', 'Materi Pokok', 'Alokasi Waktu', dan 'Profil Pelajar Pancasila'.
        2.  **Program Tahunan (Prota)**: Buat tabel Prota lengkap.
        3.  **Program Semester (Promes)**: Buat tabel Promes lengkap untuk semester ini.
        4.  **Modul Ajar**: Buat ${formData.jumlah_modul_ajar} Modul Ajar lengkap. Setiap bagian (Informasi Umum, Komponen Inti, Lampiran) harus dalam format tabel yang jelas.
        5.  **KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)**: Buat tabel KKTP dengan interval nilai dan deskripsi kriteria.
        6.  **Jurnal Harian Guru**: Buat format tabel jurnal harian yang siap diisi (Hari/Tanggal, Jam Ke, Materi, Kegiatan, Penilaian, Absensi, Catatan).

        **Aturan Format PENTING:**
        - **SELURUH KONTEN** untuk setiap bagian harus disajikan di dalam tag '<table>'. Gunakan struktur tabel (<table>, <thead>, <tbody>, <tr>, <th>, <td>) secara ekstensif.
        - Root object harus memiliki properti "sections" yang berisi array.
        - Setiap objek section harus memiliki: "id" (string unik: 'atp', 'prota', 'promes', 'modul_ajar', 'kktp', 'jurnal'), "title" (judul dokumen), "content" (string HTML).
        - **Gunakan tanda kutip tunggal (') untuk semua atribut HTML (contoh: <div class='my-class'>) untuk memastikan JSON valid.**
        - **Aturan RTL/LTR Penting:** HANYA teks yang berbahasa Arab yang harus menggunakan atribut RTL. Judul bagian dan konten lain yang tidak berbahasa Arab HARUS TETAP LTR. Untuk konten Arab di dalam sel tabel, gunakan <div style='text-align:right; direction:rtl;'>.
        - ${harakatInstruction}
        `,
        config: {
            responseMimeType: 'application/json',
            responseSchema: sectionsSchema,
            temperature: 0.7,
            ...(formData.use_thinking_mode && { thinkingConfig: { thinkingBudget: 8192 } })
        }
    }));

    // Use robust cleaner
    const result = cleanAndParseJson(response.text);
    return result.sections;
};

export const generateSoalContentSections = async (formData: FormData): Promise<GeneratedSection[]> => {
    const ai = getAiClient();
    const headerContent = formData.jenjang === 'Pesantren'
        ? `<div style='text-align: center;'><img src='${PESANTREN_HEADER_IMAGE_BASE64}' alt='Kop Surat Pesantren' style='width: 100%; max-width: 700px; margin: 0 auto;'/></div>`
        : `
        <div style='text-align: center; font-family: Times New Roman, serif; border-bottom: 3px solid black; padding-bottom: 5px; margin-bottom: 10px;'>
            ${formData.logo_sekolah ? `<img src='${formData.logo_sekolah}' alt='logo' style='width: 80px; height: auto; position: absolute; left: 20px;'>` : ''}
            <h3 style='margin: 0; font-size: 14pt; font-weight: bold;'>${formData.yayasan || ''}</h3>
            <h2 style='margin: 0; font-size: 18pt; font-weight: bold;'>${formData.sekolah}</h2>
            <p style='margin: 0; font-size: 10pt;'>${formData.alamat_sekolah || ''}</p>
        </div>
        <h3 style='text-align: center; font-family: Times New Roman, serif; font-weight: bold; margin-top: 20px;'>${formData.judul_asesmen || ''}</h3>
        <table style='width: 100%; border-collapse: collapse; font-family: Times New Roman, serif; margin-top: 15px; font-size: 11pt;'>
            <tbody>
                <tr>
                    <td style='border: none; padding: 2px; width: 15%;'>Mata Pelajaran</td>
                    <td style='border: none; padding: 2px; width: 2%;'>:</td>
                    <td style='border: none; padding: 2px; width: 33%;'>${formData.mata_pelajaran}</td>
                    <td style='border: none; padding: 2px; width: 15%;'>Tanggal</td>
                    <td style='border: none; padding: 2px; width: 2%;'>:</td>
                    <td style='border: none; padding: 2px; width: 33%;'>${formData.tanggal_ujian || ''}</td>
                </tr>
                <tr>
                    <td style='border: none; padding: 2px;'>Kelas/Semester</td>
                    <td style='border: none; padding: 2px;'>:</td>
                    <td style='border: none; padding: 2px;'>${formData.kelas} / ${formData.semester === '1' ? 'Ganjil' : 'Genap'}</td>
                    <td style='border: none; padding: 2px;'>Jam Ke-</td>
                    <td style='border: none; padding: 2px;'>:</td>
                    <td style='border: none; padding: 2px;'>${formData.jam_ke || ''}</td>
                </tr>
                 <tr>
                    <td style='border: none; padding: 2px;'>Tahun Ajaran</td>
                    <td style='border: none; padding: 2px;'>:</td>
                    <td style='border: none; padding: 2px;'>${formData.tahun_ajaran}</td>
                    <td style='border: none; padding: 2px;'>Waktu</td>
                    <td style='border: none; padding: 2px;'>:</td>
                    <td style='border: none; padding: 2px;'>${formData.waktu_ujian || ''}</td>
                </tr>
            </tbody>
        </table>
        `;
    
    const signatureBlock = `
        <div style='margin-top: 40px; overflow: auto;'>
            <div style='float: right; text-align: center; width: 250px;'>
                <p>Guru Mata Pelajaran</p>
                <br/><br/><br/>
                <p style='font-weight: bold; text-decoration: underline;'>${formData.nama_guru}</p>
            </div>
        </div>
    `;

    // --- LOGIKA HITUNGAN SOAL YANG KETAT (STRICT COUNTING LOGIC) ---
    const showPesantrenDynamicForm = formData.jenjang === 'Pesantren';
    
    let breakdownInstruction = "";
    let grandTotal = 0;

    if (showPesantrenDynamicForm) {
        breakdownInstruction = (formData.soal_pesantren_sections || []).map(section => 
            `- Bagian ${section.letter}: ${section.count} soal. Instruksi: "${section.instruction}"`
        ).join('\n');
    } else {
        // Kalkulasi Jumlah PG
        const isPgSelected = formData.jenis_soal?.includes('Pilihan Ganda');
        const pgRegular = isPgSelected ? (Number(formData.jumlah_pg) || 0) : 0;
        const pgTka = formData.sertakan_soal_tka ? (Number(formData.jumlah_soal_tka) || 0) : 0;
        const totalPg = pgRegular + pgTka;

        // Kalkulasi Jumlah Uraian
        const isUraianSelected = formData.jenis_soal?.includes('Uraian');
        const uraianRegular = isUraianSelected ? (Number(formData.jumlah_uraian) || 0) : 0;
        const uraianTka = formData.sertakan_soal_tka_uraian ? (Number(formData.jumlah_soal_tka_uraian) || 0) : 0;
        const totalUraian = uraianRegular + uraianTka;

        // Kalkulasi Jumlah Isian
        const isIsianSelected = formData.jenis_soal?.includes('Isian Singkat');
        const totalIsian = isIsianSelected ? (Number(formData.jumlah_isian_singkat) || 0) : 0;
        
        grandTotal = totalPg + totalUraian + totalIsian;

        // Bangun string breakdown yang sangat spesifik
        let parts = [];
        let currentNumber = 1;

        if (totalPg > 0) {
            let pgBreakdown = `A. PILIHAN GANDA (Total ${totalPg} Soal)`;
            pgBreakdown += `\n   - Nomor ${currentNumber} s.d. ${currentNumber + pgRegular - 1}: Soal Mapel ${formData.mata_pelajaran}.`;
            if (pgTka > 0) {
                pgBreakdown += `\n   - Nomor ${currentNumber + pgRegular} s.d. ${currentNumber + totalPg - 1}: Soal TKA (Tes Kemampuan Akademik) - Kelompok ${formData.kelompok_tka}.`;
            }
            parts.push(pgBreakdown);
            currentNumber += totalPg;
        }

        if (totalUraian > 0) {
            let uraianBreakdown = `B. URAIAN (Total ${totalUraian} Soal)`;
            uraianBreakdown += `\n   - Nomor ${currentNumber} s.d. ${currentNumber + uraianRegular - 1}: Soal Mapel ${formData.mata_pelajaran}.`;
             if (uraianTka > 0) {
                uraianBreakdown += `\n   - Nomor ${currentNumber + uraianRegular} s.d. ${currentNumber + totalUraian - 1}: Soal TKA Uraian - Kelompok ${formData.kelompok_tka}.`;
            }
            parts.push(uraianBreakdown);
            currentNumber += totalUraian;
        }

        if (totalIsian > 0) {
             let isianBreakdown = `C. ISIAN SINGKAT (Total ${totalIsian} Soal)`;
             isianBreakdown += `\n   - Nomor ${currentNumber} s.d. ${currentNumber + totalIsian - 1}: Soal Isian Singkat Mapel ${formData.mata_pelajaran}.`;
             parts.push(isianBreakdown);
        }

        breakdownInstruction = parts.join('\n\n');
    }

    const strictCountPrompt = `
    **STRUKTUR DAN JUMLAH SOAL YANG WAJIB DIBUAT (DILARANG MENYIMPANG):**
    
    ${breakdownInstruction}
    
    TOTAL KESELURUHAN: ${showPesantrenDynamicForm ? 'Sesuai bagian di atas' : grandTotal + ' Butir Soal'}.
    Pastikan penomoran berlanjut antar bagian (jangan mulai dari 1 lagi di bagian B/C kecuali diperintahkan lain).
    `;

    // DEFINISI 6 FILE WAJIB
    const sectionsToGenerate = [
        { id: "naskah_soal", title: "1. Bank Soal (Naskah Ujian)" },
        { id: "kunci_jawaban", title: "2. Kunci Jawaban & Pembahasan" },
        { id: "kisi_kisi", title: "3. Kisi-kisi Soal" },
        { id: "rubrik_penilaian", title: "4. Rubrik Penilaian/Penskoran" },
        { id: "analisis_kualitatif", title: "5. Analisis Soal Kualitatif" },
        { id: "ringkasan_materi", title: "6. Ringkasan Materi" },
    ];

    const sectionPrompts = sectionsToGenerate.map((section, index) => {
        let description = '';
        switch (section.id) {
            case 'naskah_soal':
                description = `Buat Naskah Soal lengkap. IKUTI STRUKTUR JUMLAH SOAL DI ATAS DENGAN TEPAT. Gabungkan soal Mapel dan TKA dalam satu bagian jika jenisnya sama (misal PG digabung, Uraian digabung).`;
                break;
            case 'kunci_jawaban':
                description = `Berikan kunci jawaban untuk SEMUA SOAL (sesuai jumlah di atas). Sertakan PEMBAHASAN DETAIL.`;
                break;
            case 'kisi_kisi':
                description = `Buat tabel kisi-kisi untuk SEMUA SOAL (sesuai jumlah dan nomor di atas). Kolom: No, CP, Materi, Indikator, Level Kognitif, Bentuk Soal.`;
                break;
            case 'rubrik_penilaian':
                description = 'Buat rubrik penilaian/penskoran detail. Skor PG dan Rubrik analitik untuk Uraian.';
                break;
            case 'analisis_kualitatif':
                description = 'Buat tabel analisis kualitatif: No Soal, Aspek Materi/Konstruksi/Bahasa, Keterangan Sesuai/Tidak.';
                break;
            case 'ringkasan_materi':
                description = 'Buat ringkasan materi padat dan jelas yang mencakup semua topik yang diujikan dalam soal.';
                break;
        }
        return `DOKUMEN ${index + 1}: **${section.title}**\nInstruksi: ${description}`;
    }).join('\n\n');
    
    const insyaInstruction = formData.mata_pelajaran.toUpperCase() === 'INSYA'
        ? `**Instruksi Khusus Mapel Insya':** Fokus soal adalah pada **penerapan** kaidah Nahwu/Sharaf (Qawaid) dalam membuat kalimat atau menjawab pertanyaan, BUKAN menguji teori.`
        : '';
    
    const harakatInstruction = formData.bahasa === 'Bahasa Arab' 
        ? "**PENTING: SELURUH TEKS DALAM BAHASA ARAB (TERMASUK SOAL, PILIHAN JAWABAN, DAN KUTIPAN) WAJIB DIBERI HARAKAT LENGKAP (FULL TASHKEEL) AGAR TIDAK SALAH BACA.**"
        : "";

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Anda adalah AI pembuat soal ujian ahli. Buatkan paket asesmen lengkap berdasarkan data berikut.
        **Data:**
        - Jenjang: ${formData.jenjang}
        - Kelas: ${formData.kelas}
        - Mata Pelajaran: ${formData.mata_pelajaran}
        - Topik/Materi: ${formData.topik_materi}
        - Tingkat Kesulitan: ${formData.tingkat_kesulitan}
        - Bahasa: ${formData.bahasa}
        
        ${strictCountPrompt}
        
        ${insyaInstruction}
        
        ${harakatInstruction}

        **Tugas Utama:**
        Generate paket asesmen yang WAJIB terdiri dari **6 (ENAM) FILE/BAGIAN LENGKAP** berikut dalam format JSON. Urutan dan isi harus sesuai daftar di bawah:

        ${sectionPrompts}

        **Aturan Format:**
        - **JANGAN MELEWATKAN SATU BAGIAN PUN.** Pengguna membutuhkan ke-6 file tersebut.
        - **Aturan Penomoran PENTING:** Gunakan **ANGKA** (1, 2, 3, ...) untuk menomori semua soal secara berurutan.
        - Root object harus memiliki properti "sections" yang berisi array.
        - Setiap objek section harus memiliki: "id" (string unik: ${sectionsToGenerate.map(s => `"${s.id}"`).join(', ')}), "title" (string), "content" (string HTML).
        - Untuk Naskah Soal, sertakan header ujian yang sudah disediakan di awal kontennya.
        - Gunakan tag HTML standar (<ol>, <li>, <table>).
        - **PENTING: Gunakan tanda kutip tunggal (') untuk semua atribut HTML (contoh: <div class='my-class'>) untuk memastikan JSON valid.**
        - **Aturan RTL/LTR Penting:** HANYA teks yang berbahasa Arab yang harus menggunakan atribut RTL.
        
        **Header Ujian (untuk Naskah Soal):**
        \`\`\`html
        ${headerContent}
        \`\`\`

        **Blok Tanda Tangan (untuk dokumen selain Naskah Soal):**
        \`\`\`html
        ${signatureBlock}
        \`\`\`
        `,
        config: {
            responseMimeType: 'application/json',
            responseSchema: sectionsSchema,
            temperature: 0.5,
            ...(formData.use_thinking_mode && { thinkingConfig: { thinkingBudget: 8192 } })
        }
    }));

    // Use robust cleaner
    const result = cleanAndParseJson(response.text);
    return result.sections;
};

export const generateEcourseContent = async (formData: FormData): Promise<GeneratedSection[]> => {
    const ai = getAiClient();
    
    const harakatInstruction = formData.bahasa === 'Bahasa Arab' 
        ? "**INSTRUKSI KHUSUS BAHASA ARAB: Seluruh materi dan teks Arab WAJIB MENGGUNAKAN HARAKAT LENGKAP (FULL TASHKEEL).**"
        : "";

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Anda adalah seorang *Instructional Designer* ahli. Tugas Anda adalah merancang dan membuat E-Course lengkap berdasarkan data berikut.

        **Data E-Course:**
        - Topik Utama: "${formData.topik_ecourse}"
        - Jumlah Pertemuan/Modul: ${formData.jumlah_pertemuan}
        - Nama Pengajar: ${formData.nama_guru}

        **Tugas:**
        Generate paket E-Course yang komprehensif dalam format JSON. Root object harus memiliki properti "sections" yang berisi sebuah array dengan SATU objek di dalamnya. Objek ini harus memiliki: "id" (string: "ecourse_package"), "title" (string: "Paket E-Course Lengkap: [Topik Utama]"), dan "content" (string HTML).

        **Struktur Konten HTML dalam "content":**
        Konten HTML harus terstruktur dengan baik dan mencakup bagian-bagian berikut:
        1.  **Silabus & Rencana Pembelajaran (Learning Path)**:
            - Judul, Deskripsi Singkat, Tujuan Pembelajaran Umum, Target Audiens.
            - Tabel Rencana Pembelajaran yang mencakup: Nomor Pertemuan, Judul Materi, Aktivitas (Materi, Latihan, Kuis), dan Estimasi Waktu.
        2.  **Materi Pembelajaran per Pertemuan**:
            - Buat H3 untuk setiap pertemuan (Contoh: "<h3>Pertemuan 1: Judul Materi</h3>").
            - Untuk setiap pertemuan, sertakan:
                - **Tujuan Pembelajaran Khusus** (menggunakan <ul>).
                - **Materi Utama** (paragraf, poin-poin, dan penjelasan mendalam).
                - **Latihan / Studi Kasus** (deskripsi latihan yang relevan).
                - **Evaluasi / Kuis** (beberapa contoh pertanyaan singkat untuk menguji pemahaman).
        3.  **Konten Slide Presentasi (PPT)**:
            - Buat bagian khusus yang diawali dengan: \`<!-- SLIDE_CONTENT_START -->\` dan diakhiri dengan \`<!-- SLIDE_CONTENT_END -->\`.
            - Di dalam blok ini, generate konten untuk slide presentasi. Gunakan format berikut untuk setiap slide:
                - \`<div class='ppt-slide'>\`
                - \`<h4 class='slide-title'>Judul Slide</h4>\`
                - \`<div class='slide-content'>Konten slide di sini (bisa berupa poin-poin dalam <ul><li>...</li></ul> atau paragraf).</div>\`
                - \`</div>\`
            - Pastikan untuk membuat beberapa slide yang mencakup ringkasan dari semua pertemuan.

        **Aturan Penting:**
        - Gunakan tag HTML standar (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <strong>).
        - **PENTING: Gunakan tanda kutip tunggal (') untuk semua atribut HTML (contoh: <div class='my-class'>) untuk memastikan JSON valid.**
        - Pastikan seluruh output adalah satu string HTML yang valid di dalam properti "content".
        - ${harakatInstruction}
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: sectionsSchema,
            temperature: 0.7,
            ...(formData.use_thinking_mode && { thinkingConfig: { thinkingBudget: 16384 } })
        }
    }));

    // Use robust cleaner
    const result = cleanAndParseJson(response.text);
    
    // Process the HTML content to wrap slide content
    if (result.sections && result.sections[0] && result.sections[0].content) {
        let htmlContent = result.sections[0].content;
        const slideStartTag = '<!-- SLIDE_CONTENT_START -->';
        const slideEndTag = '<!-- SLIDE_CONTENT_END -->';
        const startIndex = htmlContent.indexOf(slideStartTag);
        const endIndex = htmlContent.indexOf(slideEndTag);

        if (startIndex !== -1 && endIndex !== -1) {
            const slideContent = htmlContent.substring(startIndex + slideStartTag.length, endIndex);
            const wrappedSlideContent = `<div class="ppt-container"><h2>Konten Slide Presentasi</h2>${slideContent}</div>`;
            htmlContent = htmlContent.substring(0, startIndex) + wrappedSlideContent + htmlContent.substring(endIndex + slideEndTag.length);
            result.sections[0].content = htmlContent;
        }
    }
    
    return result.sections;
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response: GenerateImagesResponse = await withRetry(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    }));
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image data found in response");
};

export const analyzeImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64ImageData,
        },
    };
    const textPart = {
        text: prompt,
    };
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    }));
    return response.text;
};

export const generateVideo = async (
    prompt: string, 
    image: { imageBytes: string; mimeType: string } | null, 
    aspectRatio: '16:9' | '9:16'
): Promise<any> => {
    const ai = getAiClient();
    const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    };
    if (image) {
        payload.image = image;
    }
    const operation = await ai.models.generateVideos(payload);
    return operation;
};

export const checkVideoOperation = async (operation: any): Promise<any> => {
    const ai = getAiClient();
    return await ai.operations.getVideosOperation({ operation: operation });
};

export const analyzeVideoFrames = async (frames: {data: string, mimeType: string}[], prompt: string): Promise<string> => {
    const ai = getAiClient();
    const parts = [
        ...frames.map(frame => ({
            inlineData: {
                data: frame.data,
                mimeType: frame.mimeType,
            }
        })),
        { text: prompt }
    ];

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: parts },
    }));

    return response.text;
};


// Helper functions for TTS audio decoding
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const textToSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = getAiClient();
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a friendly and clear female Indonesian voice: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    }));
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from TTS API.");
    }
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const decodedBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
    audioContext.close();
    return audioBuffer;
};

export const groundedSearch = async (query: string, tool: 'web' | 'maps', location?: { latitude: number, longitude: number }): Promise<{ text: string, sources: GroundingSource[] }> => {
    const ai = getAiClient();
    const tools: any[] = tool === 'web' ? [{ googleSearch: {} }] : [{ googleMaps: {} }];
    
    const config: any = { tools };
    if (tool === 'maps' && location) {
        config.toolConfig = { retrievalConfig: { latLng: location } };
    }
    
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config,
    }));

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks.map((chunk: any) => {
         if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
         if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title };
         return null;
    }).filter((s: any): s is GroundingSource => s !== null);

    return { text, sources };
};
