import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Shield, Upload, Lock, Eye, EyeOff, Download, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface ProtectionOptions {
  userPassword: string;
  ownerPassword: string;
  canPrint: boolean;
  canModify: boolean;
  canCopy: boolean;
  canAnnotate: boolean;
}

const PDFProtect: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [previewPage, setPreviewPage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [options, setOptions] = useState<ProtectionOptions>({
    userPassword: '',
    ownerPassword: '',
    canPrint: true,
    canModify: false,
    canCopy: true,
    canAnnotate: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Hanya file PDF yang diperbolehkan!');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setPdfFile(file);
    
    // Create URL for the PDF file
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    
    // Reset preview
    setPreviewPage(null);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const updateOption = <K extends keyof ProtectionOptions>(key: K, value: ProtectionOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const previewPageHandler = (pageNumber: number) => {
    setPreviewPage(pageNumber);
  };

  const closePreview = () => {
    setPreviewPage(null);
  };

  const validatePasswords = (): boolean => {
    if (!options.userPassword.trim()) {
      setError('Password tidak boleh kosong!');
      return false;
    }
    
    if (options.userPassword.length < 4) {
      setError('Password harus minimal 4 karakter!');
      return false;
    }
    
    if (options.ownerPassword.trim() && options.ownerPassword.length < 4) {
      setError('Password pemilik harus minimal 4 karakter atau kosong!');
      return false;
    }
    
    return true;
  };

  const generateRandomPassword = (length: number = 8) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setOptions(prev => ({ ...prev, userPassword: password }));
  };

  const protectPDF = async () => {
    if (!pdfFile) {
      setError('Pilih file PDF terlebih dahulu!');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Load PDF
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Set protection
      const userPassword = options.userPassword;
      const ownerPassword = options.ownerPassword || options.userPassword;
      
      // Encrypt the PDF with the correct method
      await pdfDoc.encrypt({
        userPassword,
        ownerPassword,
        permissions: {
          printing: options.canPrint ? 'highResolution' : 'none',
          modifying: options.canModify,
          copying: options.canCopy,
          annotating: options.canAnnotate,
          fillingForms: options.canAnnotate,
          contentAccessibility: true,
          documentAssembly: options.canModify,
        },
      });
      
      // Save the encrypted PDF
      const encryptedPdfBytes = await pdfDoc.save();
      const blob = new Blob([encryptedPdfBytes], { type: 'application/pdf' });
      
      // Generate a filename
      const originalName = pdfFile.name;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const newFileName = `${baseName}-protected.pdf`;
      
      saveAs(blob, newFileName);
      setSuccessMessage(`PDF berhasil dienkripsi dan disimpan sebagai "${newFileName}"`);
      
    } catch (error) {
      console.error('Error protecting PDF:', error);
      setError('Terjadi kesalahan saat mengenkripsi PDF. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4 shadow-lg shadow-purple-500/20">
            <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pelindung PDF (Protect PDF)
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Amankan PDF Anda dengan menambahkan enkripsi password.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8 shadow-lg shadow-purple-500/10">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            Fitur Keamanan PDF:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-purple-800 dark:text-purple-200">
            <li>Tambahkan password untuk membuka dokumen</li>
            <li>Batasi izin pencetakan, penyalinan, dan pengeditan</li>
            <li>Enkripsi 128-bit untuk keamanan tinggi</li>
            <li>Lindungi informasi sensitif dari akses tidak sah</li>
            <li>Proses dilakukan secara lokal untuk privasi maksimal</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-700 dark:text-red-300 shadow-lg shadow-red-500/10">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-green-700 dark:text-green-300 shadow-lg shadow-green-500/10">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - File Upload & Preview */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                1. Unggah File PDF
              </h3>
              
              {!pdfFile ? (
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Klik untuk memilih file PDF
                  </p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-purple-500/30">
                    Pilih File PDF
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{pdfFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {numPages ? `${numPages} halaman • ${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Memuat...'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPdfFile(null);
                        setPdfUrl(null);
                        setNumPages(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* PDF Preview */}
            {pdfUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preview PDF
                </h3>
                
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 mb-3">
                  <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => {
                      console.error('Error loading PDF:', error);
                      setError('Terjadi kesalahan saat memuat PDF. Pastikan file tidak rusak.');
                    }}
                  >
                    <Page 
                      pageNumber={1} 
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={300}
                    />
                  </Document>
                </div>
                
                {numPages && numPages > 1 && (
                  <div className="text-center">
                    <button
                      onClick={() => previewPageHandler(1)}
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Lihat Semua Halaman</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Process Button */}
            {pdfFile && (
              <button
                onClick={protectPDF}
                disabled={isProcessing || !pdfFile}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Enkripsi PDF & Unduh</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column - Options */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                2. Pengaturan Keamanan
              </h3>
              
              <div className="space-y-6">
                {/* Passwords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Dokumen *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={options.userPassword}
                      onChange={(e) => updateOption('userPassword', e.target.value)}
                      placeholder="Masukkan password untuk membuka dokumen"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-20"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => generateRandomPassword()}
                        className="p-2 mr-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                        title="Generate random password"
                      >
                        <span className="text-xs font-medium">Generate</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Password ini akan diminta saat membuka dokumen
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Pemilik (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      type={showOwnerPassword ? "text" : "password"}
                      value={options.ownerPassword}
                      onChange={(e) => updateOption('ownerPassword', e.target.value)}
                      placeholder="Password untuk hak akses penuh (opsional)"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-20"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      >
                        {showOwnerPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => generateRandomPassword()}
                        className="p-2 mr-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                        title="Generate random password"
                      >
                        <span className="text-xs font-medium">Generate</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Jika kosong, akan menggunakan password dokumen
                  </p>
                </div>
                
                {/* Permissions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Izin Dokumen
                  </h4>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="canPrint"
                        checked={options.canPrint}
                        onChange={(e) => updateOption('canPrint', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="canPrint" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Izinkan pencetakan
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="canModify"
                        checked={options.canModify}
                        onChange={(e) => updateOption('canModify', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="canModify" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Izinkan modifikasi konten
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="canCopy"
                        checked={options.canCopy}
                        onChange={(e) => updateOption('canCopy', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="canCopy" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Izinkan penyalinan teks dan gambar
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="canAnnotate"
                        checked={options.canAnnotate}
                        onChange={(e) => updateOption('canAnnotate', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="canAnnotate" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Izinkan anotasi dan pengisian formulir
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6 shadow-lg shadow-purple-500/10">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  Informasi Keamanan
                </h3>
              </div>
              
              <div className="space-y-3 text-purple-800 dark:text-purple-200 text-sm">
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>PDF akan dienkripsi dengan enkripsi 128-bit, standar keamanan yang diakui industri.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Password dokumen diperlukan untuk membuka PDF. Simpan password Anda di tempat yang aman.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Password pemilik memberikan akses penuh untuk mengubah izin dan menghapus keamanan.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Semua proses enkripsi dilakukan di browser Anda. Password dan dokumen tidak dikirim ke server.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Jika Anda lupa password, tidak ada cara untuk membuka dokumen yang terenkripsi.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Preview Modal */}
        {previewPage !== null && pdfUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Preview Dokumen
                </h3>
                <button
                  onClick={closePreview}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <Document
                  file={pdfFile}
                  onLoadError={(error) => {
                    console.error('Error loading PDF for preview:', error);
                    setError('Terjadi kesalahan saat memuat preview PDF.');
                  }}
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div key={`page_${index + 1}`} className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Halaman {index + 1}</p>
                      <Page 
                        pageNumber={index + 1} 
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={600}
                      />
                    </div>
                  ))}
                </Document>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Keamanan Tinggi</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enkripsi standar industri untuk melindungi dokumen Anda
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Kontrol Akses</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Batasi siapa yang dapat melihat, mencetak, atau mengedit
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">🔐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Privasi Terjamin</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Semua proses dilakukan di browser, tanpa upload ke server
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFProtect;