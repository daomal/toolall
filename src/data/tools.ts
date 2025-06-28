import { FileText, Image, Type, QrCode, Palette, FileImage, Merge, ArrowUpDown, PenTool, Droplets, Edit3, FileSpreadsheet, User, RefreshCw, Compass as Compress, Clock, CreditCard, Calculator, Mail, RotateCcw, Shield, Hash, Crop, DollarSign, Percent, Receipt, PiggyBank, Landmark, FileCheck, BookOpen, Ruler, Users, TrendingUp, Zap, Camera, Palette as PaletteIcon, Calendar, FileText as FileTextIcon, CalendarClock, Clock as ClockIcon, BookOpen as BookOpenIcon, RotateCw, Tag, Lock, Thermometer, Utensils } from 'lucide-react';

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  path: string;
}

export const tools: Tool[] = [
  // KATEGORI: UTILITAS DOKUMEN & PDF
  {
    id: 'pdf-merger',
    title: 'Penggabung PDF (PDF Merger)',
    description: 'Gabungkan beberapa file PDF menjadi satu dokumen.',
    icon: Merge,
    category: 'Dokumen & PDF',
    path: '/pdf-merger'
  },
  {
    id: 'pdf-organizer',
    title: 'Pengatur PDF (Organize PDF)',
    description: 'Ubah urutan, putar, dan hapus halaman dalam PDF Anda.',
    icon: ArrowUpDown,
    category: 'Dokumen & PDF',
    path: '/pdf-organizer'
  },
  {
    id: 'jpg-to-pdf',
    title: 'Konverter JPG ke PDF',
    description: 'Ubah satu atau beberapa gambar menjadi satu file PDF.',
    icon: FileImage,
    category: 'Dokumen & PDF',
    path: '/jpg-to-pdf'
  },
  {
    id: 'pdf-signature',
    title: 'Tambah Tanda Tangan ke PDF',
    description: 'Tempelkan gambar tanda tangan Anda ke dokumen PDF.',
    icon: PenTool,
    category: 'Dokumen & PDF',
    path: '/pdf-signature'
  },
  {
    id: 'pdf-watermark',
    title: 'Tambah Watermark ke PDF',
    description: 'Beri tanda air berupa teks pada setiap halaman PDF.',
    icon: Droplets,
    category: 'Dokumen & PDF',
    path: '/pdf-watermark'
  },
  {
    id: 'text-to-pdf',
    title: 'Editor Teks ke PDF',
    description: 'Tulis dokumen di editor kami dan unduh sebagai PDF.',
    icon: Edit3,
    category: 'Dokumen & PDF',
    path: '/text-to-pdf'
  },
  {
    id: 'invoice-generator',
    title: 'Generator Invoice',
    description: 'Buat invoice profesional dan unduh dalam format PDF.',
    icon: FileSpreadsheet,
    category: 'Dokumen & PDF',
    path: '/invoice-generator'
  },
  {
    id: 'cv-builder',
    title: 'Pembuat CV/Resume',
    description: 'Buat CV/Resume profesional dari template sederhana.',
    icon: User,
    category: 'Dokumen & PDF',
    path: '/cv-builder'
  },
  {
    id: 'pdf-page-numbers',
    title: 'Penambah Nomor Halaman PDF',
    description: 'Beri nomor halaman secara otomatis pada dokumen PDF Anda.',
    icon: Hash,
    category: 'Dokumen & PDF',
    path: '/pdf-page-numbers'
  },
  {
    id: 'pdf-protect',
    title: 'Pelindung PDF (Protect PDF)',
    description: 'Amankan PDF Anda dengan menambahkan enkripsi password.',
    icon: Shield,
    category: 'Dokumen & PDF',
    path: '/pdf-protect'
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF ke JPG',
    description: 'Simpan setiap halaman PDF sebagai file gambar JPG berkualitas tinggi.',
    icon: Image,
    category: 'Dokumen & PDF',
    path: '/pdf-to-jpg'
  },
  {
    id: 'citation-generator',
    title: 'Generator Sitasi Ilmiah',
    description: 'Buat kutipan dan daftar pustaka dalam format APA, MLA, dll.',
    icon: BookOpen,
    category: 'Dokumen & PDF',
    path: '/citation-generator'
  },

  // KATEGORI: UTILITAS GAMBAR & GRAFIS
  {
    id: 'image-converter',
    title: 'Konverter Gambar',
    description: 'Ubah format gambar (JPG, PNG, WEBP) dengan mudah.',
    icon: RefreshCw,
    category: 'Gambar & Grafis',
    path: '/image-converter'
  },
  {
    id: 'unit-converter',
    title: 'Konverter Unit Lengkap',
    description: 'Konversi berbagai satuan: panjang, berat, suhu, volume, dan lainnya.',
    icon: RotateCcw,
    category: 'Gambar & Grafis',
    path: '/konverter-unit'
  },
  {
    id: 'color-palette-generator',
    title: 'Generator Palet Warna',
    description: 'Dapatkan inspirasi palet warna untuk desain Anda.',
    icon: Palette,
    category: 'Gambar & Grafis',
    path: '/color-palette-generator'
  },
  {
    id: 'social-media-resizer',
    title: 'Social Media Image Resizer',
    description: 'Potong gambar sesuai ukuran optimal untuk Instagram, Twitter, dll.',
    icon: Crop,
    category: 'Gambar & Grafis',
    path: '/social-media-resizer'
  },

  // KATEGORI: PRODUKTIVITAS & ALAT BANTU
  {
    id: 'text-counter',
    title: 'Penghitung Teks',
    description: 'Hitung jumlah kata, karakter, dan paragraf.',
    icon: Type,
    category: 'Produktivitas',
    path: '/text-counter'
  },
  {
    id: 'pomodoro-timer',
    title: 'Pomodoro Timer',
    description: 'Tingkatkan fokus belajar atau bekerja dengan timer Pomodoro.',
    icon: Clock,
    category: 'Produktivitas',
    path: '/pomodoro-timer'
  },
  {
    id: 'flashcard-maker',
    title: 'Pembuat Flashcard',
    description: 'Buat kartu digital untuk membantu hafalan Anda.',
    icon: CreditCard,
    category: 'Produktivitas',
    path: '/flashcard-maker'
  },
  {
    id: 'profit-calculator',
    title: 'Kalkulator Profit',
    description: 'Hitung keuntungan bisnis dan harga jual produk.',
    icon: Calculator,
    category: 'Produktivitas',
    path: '/profit-calculator'
  },
  {
    id: 'itinerary-planner',
    title: 'Visual Itinerary Planner',
    description: 'Buat jadwal visual acara/perjalanan yang bisa dibagikan.',
    icon: Calendar,
    category: 'Produktivitas',
    path: '/itinerary-planner'
  },
  {
    id: 'meeting-notes-generator',
    title: 'Generator Notulen Rapat',
    description: 'Buat notulen rapat terstruktur dengan action items.',
    icon: FileTextIcon,
    category: 'Produktivitas',
    path: '/meeting-notes-generator'
  },
  {
    id: 'date-calculator',
    title: 'Kalkulator Durasi & Tanggal',
    description: 'Hitung selisih antar tanggal atau tanggal di masa depan.',
    icon: CalendarClock,
    category: 'Produktivitas',
    path: '/date-calculator'
  },
  {
    id: 'world-time-calculator',
    title: 'Kalkulator Waktu Dunia',
    description: 'Bandingkan zona waktu & cari jadwal rapat ideal.',
    icon: ClockIcon,
    category: 'Produktivitas',
    path: '/world-time-calculator'
  },
  {
    id: 'study-planner',
    title: 'Study Planner',
    description: 'Buat jadwal belajar mingguan untuk berbagai mata pelajaran.',
    icon: BookOpenIcon,
    category: 'Produktivitas',
    path: '/study-planner'
  },
  {
    id: 'random-picker-wheel',
    title: 'Roda Undian / Pemilih Acak',
    description: 'Roda putar untuk mengundi nama, hadiah, atau pilihan.',
    icon: RotateCw,
    category: 'Produktivitas',
    path: '/random-picker-wheel'
  },

  // KATEGORI: KALKULATOR & KEUANGAN
  {
    id: 'financial-calculators',
    title: 'Kalkulator Finansial (Paket)',
    description: 'Hitung diskon, PPN, dan persentase dengan cepat.',
    icon: DollarSign,
    category: 'Kalkulator & Keuangan',
    path: '/financial-calculators'
  },
  {
    id: 'unit-price-calculator',
    title: 'Kalkulator Harga per Unit',
    description: 'Bandingkan harga barang berdasarkan satuan (per kg, per ml).',
    icon: Ruler,
    category: 'Kalkulator & Keuangan',
    path: '/unit-price-calculator'
  },
  {
    id: 'bill-splitter',
    title: 'Kalkulator Pembagi Tagihan & Tip',
    description: 'Bagi tagihan restoran secara adil untuk beberapa orang.',
    icon: Users,
    category: 'Kalkulator & Keuangan',
    path: '/bill-splitter'
  },
  {
    id: 'loan-calculator',
    title: 'Kalkulator Bunga Pinjaman',
    description: 'Hitung estimasi cicilan bulanan untuk pinjaman.',
    icon: Landmark,
    category: 'Kalkulator & Keuangan',
    path: '/loan-calculator'
  },
  {
    id: 'zakat-calculator',
    title: 'Kalkulator Zakat Profesional',
    description: 'Bantu hitung zakat penghasilan dan maal sesuai aturan.',
    icon: PiggyBank,
    category: 'Kalkulator & Keuangan',
    path: '/zakat-calculator'
  },
  {
    id: 'tax-calculator',
    title: 'Kalkulator Pajak (Sederhana)',
    description: 'Estimasi perhitungan pajak penghasilan pribadi.',
    icon: Receipt,
    category: 'Kalkulator & Keuangan',
    path: '/tax-calculator'
  },

  // KATEGORI: DEVELOPER & SEO
  {
    id: 'meta-tag-generator',
    title: 'Meta Tag & Open Graph Generator',
    description: 'Buat tag meta HTML untuk optimasi SEO dan media sosial.',
    icon: Tag,
    category: 'Developer & SEO',
    path: '/meta-tag-generator'
  },

  // KATEGORI: KEAMANAN & PRIVASI
  {
    id: 'secure-note',
    title: 'Catatan Rahasia Terenkripsi',
    description: 'Kirim pesan rahasia yang aman dan bisa hancur sendiri.',
    icon: Lock,
    category: 'Keamanan & Privasi',
    path: '/secure-note'
  },

  // KATEGORI: KESEHATAN & GAYA HIDUP
  {
    id: 'bmi-calculator',
    title: 'Kalkulator IMT / BMI',
    description: 'Hitung Indeks Massa Tubuh untuk mengetahui status berat badan.',
    icon: Thermometer,
    category: 'Kesehatan & Gaya Hidup',
    path: '/bmi-calculator'
  },
  {
    id: 'calorie-calculator',
    title: 'Kalkulator Kalori',
    description: 'Hitung estimasi kebutuhan kalori harian Anda.',
    icon: Utensils,
    category: 'Kesehatan & Gaya Hidup',
    path: '/calorie-calculator'
  },

  // KATEGORI: ALAT WEB & PEMASARAN
  {
    id: 'qr-code-generator',
    title: 'Generator Kode QR',
    description: 'Buat kode QR untuk URL, teks, atau data lainnya.',
    icon: QrCode,
    category: 'Web & Pemasaran',
    path: '/qr-code-generator'
  },
  {
    id: 'email-signature-generator',
    title: 'Generator Tanda Tangan Email',
    description: 'Buat tanda tangan email HTML yang profesional.',
    icon: Mail,
    category: 'Web & Pemasaran',
    path: '/email-signature-generator'
  }
];

export const categories = [
  'Semua',
  'Dokumen & PDF',
  'Gambar & Grafis',
  'Produktivitas',
  'Kalkulator & Keuangan',
  'Developer & SEO',
  'Keamanan & Privasi',
  'Kesehatan & Gaya Hidup',
  'Web & Pemasaran'
];