
export const KELAS_OPTIONS: Record<string, string[]> = {
    'SD': ['1', '2', '3', '4', '5', '6'],
    'MI': ['1', '2', '3', '4', '5', '6'],
    'SMP': ['7', '8', '9'],
    'MTS': ['7', '8', '9'],
    'SMA': ['10', '11', '12'],
    'MA': ['10', '11', '12'],
    'Pesantren': ['I\'dad', '1', '2', '3', '4', '5', '6 KMI'],
};

const islamicAndLanguageSubjects = [
    'PAI dan Budi Pekerti', 'Bahasa Sunda', 'Bahasa Arab', 'Grammar', 'Nahwu',
    'Sharaf', 'Ulumul Quran', 'Ushul Fiqh', 'Tarbiyah', 'Insya', 'Hadits',
    'Mushtolahul Hadits', 'Fiqih', 'Tarikh Islam'
];

// Subjects specific to Madrasah under Kemenag
const kemenagSubjects = [
    "Al-Qur'an Hadits",
    'Akidah Akhlak',
    'Fiqih',
    'Sejarah Kebudayaan Islam (SKI)',
    'Bahasa Arab'
];

const pesantrenSubjects = [
    'AQIDAH', 'BALAGHAH', 'BAHASA ARAB', 'FAROID', 'FIQIH', 'HADIS', 'IMLA', 'INSYA', 'KHOT', 'KHOT IMLA', 'MAHFUDZAT',
    'MUST HADITS', 'MUTHALAAH', 'NAHWU', 'READING & GRAMMAR', 'SHARAF', 'TAFSIR', 'TAHFIDZ',
    'TAJWID', 'TAMRIN LUGHAH', 'TARBIYAH', 'TARIKH ISLAM', 'ULUMUL QURAN', 'USHUL FIQH'
];

// Consolidate all subjects that should be treated as Arabic context into one list.
// Normalized to uppercase for reliable matching.
const allArabicRelatedSubjects = [
    'Bahasa Arab', 'Nahwu', 'Sharaf', 'Shorof', 'Tarbiyah', 'Insya', 'Hadits',
    'Mushtolahul Hadits', 'Fiqih', 'Tarikh Islam', 'Balaghah', 'Imla',
    'Khot', 'Khot Imla', 'Muthola\'ah', 'Muthalaah', 'Tamrin Lughoh', 
    'Tamrin Lughah', 'Tafsir', 'Ulumul Qur\'an', 'Ushul Fiqh',
    ...kemenagSubjects,
    ...pesantrenSubjects
];

// Subjects that require full Arabic language context
const fullArabicSubjects = [...new Set(allArabicRelatedSubjects.map(s => s.toUpperCase().replace(/'|\\/g, '')))];


export const ARABIC_SUBJECTS = [
    ...new Set([
        'PAI DAN BUDI PEKERTI', // This one might be mixed, but kept for styling
        ...fullArabicSubjects
    ])
];

// Subjects considered as exact sciences for question count logic
export const EKSAK_SUBJECTS = ['MATEMATIKA', 'IPA', 'FISIKA', 'KIMIA', 'BIOLOGI', 'INFORMATIKA', 'KODING DAN KECERDASAN ARTIFISIAL (KKA)'];


// Base subjects for each level
const sdSubjects = ['Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'PPKn', 'Bahasa Inggris', 'PJOK', 'Seni Budaya', 'Prakarya', 'PAI dan Budi Pekerti'];
const smpSubjects = ['Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'PPKn', 'Bahasa Inggris', 'PJOK', 'Seni Budaya', 'Prakarya', 'Bahasa Daerah'];
const smaSubjects = ['Bahasa Indonesia', 'Matematika', 'Fisika', 'Kimia', 'Biologi', 'Ekonomi', 'Geografi', 'Sejarah', 'Sosiologi', 'PPKn', 'Bahasa Inggris', 'Informatika', 'Koding dan Kecerdasan Artifisial (KKA)', 'PJOK', 'Seni Budaya', 'Prakarya'];


export const MATA_PELAJARAN_OPTIONS: Record<string, string[]> = {
    'SD': sdSubjects,
    'MI': [...new Set([...sdSubjects, ...kemenagSubjects])],
    'SMP': [...new Set([...smpSubjects, ...islamicAndLanguageSubjects])],
    'MTS': [...new Set([...smpSubjects, ...kemenagSubjects, ...islamicAndLanguageSubjects])],
    'SMA': [...new Set([...smaSubjects, ...islamicAndLanguageSubjects])],
    'MA': [...new Set([...smaSubjects, ...kemenagSubjects, ...islamicAndLanguageSubjects])],
    'Pesantren': pesantrenSubjects
};

export const ALOKASI_WAKTU_OPTIONS: Record<string, string[]> = {
    'SD': ['2 JP/minggu (70 JP/tahun)', '3 JP/minggu (105 JP/tahun)', '4 JP/minggu (140 JP/tahun)'],
    'MI': ['2 JP/minggu (70 JP/tahun)', '3 JP/minggu (105 JP/tahun)', '4 JP/minggu (140 JP/tahun)'],
    'SMP': ['2 JP/minggu (72 JP/tahun)', '3 JP/minggu (108 JP/tahun)', '4 JP/minggu (144 JP/tahun)'],
    'MTS': ['2 JP/minggu (72 JP/tahun)', '3 JP/minggu (108 JP/tahun)', '4 JP/minggu (144 JP/tahun)'],
    'SMA': ['2 JP/minggu (90 menit/minggu)', '3 JP/minggu (135 menit/minggu)', '4 JP/minggu (180 menit/minggu)'],
    'MA': ['2 JP/minggu (90 menit/minggu)', '3 JP/minggu (135 menit/minggu)', '4 JP/minggu (180 menit/minggu)'],
    'Pesantren': ['2 JP/minggu (90 menit/minggu)', '3 JP/minggu (135 menit/minggu)', '4 JP/minggu (180 menit/minggu)', '5 JP/minggu (225 menit/minggu)']
};

export const PESANTREN_SOAL_LETTERS = ['Alif', 'Ba', 'Jim', 'Dal', 'Ha', 'Waw', 'Zay'];
export const PESANTREN_SOAL_LETTERS_LATIN = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
