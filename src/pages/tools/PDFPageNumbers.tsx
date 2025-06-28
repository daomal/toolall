import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Hash, Upload, Download, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PageNumberOptions {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  format: 'simple' | 'withTotal' | 'custom';
  customFormat: string;
  startNumber: number;
  fontSize: number;
  fontColor: string;
  margin: number;
  excludeFirstPage: boolean;
  excludeLastPage: boolean;
  excludePages: string;
}

const PDFPageNumbers: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [previewPage, setPreviewPage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'simple',
    customFormat: 'Page {page}',
    startNumber: 1,
    fontSize: 12,
    fontColor: '#000000',
    margin: 20,
    excludeFirstPage: false,
    excludeLastPage: false,
    excludePages: ''
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

  const updateOption = <K extends keyof PageNumberOptions>(key: K, value: PageNumberOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const previewPageHandler = (pageNumber: number) => {
    setPreviewPage(pageNumber);
  };

  const closePreview = () => {
    setPreviewPage(null);
  };

  const parseExcludedPages = (excludePages: string): number[] => {
    if (!excludePages.trim()) return [];
    
    const result: number[] = [];
    const parts = excludePages.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            result.push(i);
          }
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page)) {
          result.push(page);
        }
      }
    }
    
    return result;
  };

  const getPageNumberText = (pageIndex: number, totalPages: number): string => {
    const pageNumber = pageIndex + options.startNumber;
    
    switch (options.format) {
      case 'simple':
        return `${pageNumber}`;
      case 'withTotal':
        return `${pageNumber} / ${totalPages}`;
      case 'custom':
        return options.customFormat
          .replace('{page}', pageNumber.toString())
          .replace('{total}', totalPages.toString());
      default:
        return `${pageNumber}`;
    }
  };

  const getPositionCoordinates = (pageWidth: number, pageHeight: number, textWidth: number): { x: number, y: number } => {
    const margin = options.margin;
    
    switch (options.position) {
      case 'top-left':
        return { x: margin, y: pageHeight - margin };
      case 'top-center':
        return { x: (pageWidth - textWidth) / 2, y: pageHeight - margin };
      case 'top-right':
        return { x: pageWidth - margin - textWidth, y: pageHeight - margin };
      case 'bottom-left':
        return { x: margin, y: margin + options.fontSize / 2 };
      case 'bottom-center':
        return { x: (pageWidth - textWidth) / 2, y: margin + options.fontSize / 2 };
      case 'bottom-right':
        return { x: pageWidth - margin - textWidth, y: margin + options.fontSize / 2 };
      default:
        return { x: margin, y: margin + options.fontSize / 2 };
    }
  };

  const addPageNumbers = async () => {
    if (!pdfFile) {
      setError('Pilih file PDF terlebih dahulu!');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Load PDF
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const totalPages = pdfDoc.getPageCount();
      
      // Load font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Parse color
      const hexColor = options.fontColor.replace('#', '');
      const r = parseInt(hexColor.substr(0, 2), 16) / 255;
      const g = parseInt(hexColor.substr(2, 2), 16) / 255;
      const b = parseInt(hexColor.substr(4, 2), 16) / 255;
      
      // Parse excluded pages
      const excludedPages = parseExcludedPages(options.excludePages);
      if (options.excludeFirstPage) {
        excludedPages.push(1);
      }
      if (options.excludeLastPage) {
        excludedPages.push(totalPages);
      }
      
      // Add page numbers
      for (let i = 0; i < totalPages; i++) {
        const pageNumber = i + 1;
        
        // Skip excluded pages
        if (excludedPages.includes(pageNumber)) {
          continue;
        }
        
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        const pageText = getPageNumberText(i, totalPages);
        const textWidth = font.widthOfTextAtSize(pageText, options.fontSize);
        
        const { x, y } = getPositionCoordinates(width, height, textWidth);
        
        page.drawText(pageText, {
          x,
          y,
          size: options.fontSize,
          font,
          color: rgb(r, g, b)
        });
      }
      
      // Save the PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      
      // Generate a filename
      const originalName = pdfFile.name;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const newFileName = `${baseName}-with-page-numbers.pdf`;
      
      saveAs(blob, newFileName);
      setSuccessMessage(`PDF berhasil ditambahkan nomor halaman dan disimpan sebagai "${newFileName}"`);
      
    } catch (error) {
      console.error('Error adding page numbers to PDF:', error);
      setError('Terjadi kesalahan saat menambahkan nomor halaman ke PDF. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-white dark:bg-gray-900">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mb-4 shadow-lg shadow-indigo-500/20">
            <Hash className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Penambah Nomor Halaman PDF
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Beri nomor halaman secara otomatis pada dokumen PDF Anda.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-8 shadow-lg shadow-indigo-500/10">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
            Fitur Penomoran Halaman:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-200">
            <li>Tambahkan nomor halaman ke dokumen PDF dengan berbagai format</li>
            <li>Pilih posisi nomor halaman (atas, bawah, kiri, tengah, kanan)</li>
            <li>Sesuaikan ukuran, warna, dan margin nomor halaman</li>
            <li>Kecualikan halaman tertentu dari penomoran</li>
            <li>Format kustom dengan placeholder {'{page}'} dan {'{total}'}</li>
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
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Klik untuk memilih file PDF
                  </p>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-indigo-500/30">
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
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/30 transition-colors duration-200"
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
                onClick={addPageNumbers}
                disabled={isProcessing || !pdfFile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/30"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Tambah Nomor Halaman & Unduh</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column - Options */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                2. Pengaturan Nomor Halaman
              </h3>
              
              <div className="space-y-6">
                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Posisi Nomor Halaman
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'top-left', label: 'Kiri Atas' },
                      { value: 'top-center', label: 'Tengah Atas' },
                      { value: 'top-right', label: 'Kanan Atas' },
                      { value: 'bottom-left', label: 'Kiri Bawah' },
                      { value: 'bottom-center', label: 'Tengah Bawah' },
                      { value: 'bottom-right', label: 'Kanan Bawah' }
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => updateOption('position', pos.value as any)}
                        className={`p-3 rounded-lg border ${
                          options.position === pos.value
                            ? 'bg-indigo-100 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        } text-sm transition-colors duration-200`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Format Nomor Halaman
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { value: 'simple', label: 'Sederhana (1, 2, 3...)' },
                      { value: 'withTotal', label: 'Dengan Total (1/10, 2/10...)' },
                      { value: 'custom', label: 'Kustom' }
                    ].map((format) => (
                      <button
                        key={format.value}
                        onClick={() => updateOption('format', format.value as any)}
                        className={`p-3 rounded-lg border ${
                          options.format === format.value
                            ? 'bg-indigo-100 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        } text-sm transition-colors duration-200`}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                  
                  {options.format === 'custom' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Contoh: Halaman {page} dari {total}"
                        value={options.customFormat}
                        onChange={(e) => updateOption('customFormat', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Gunakan {'{page}'} untuk nomor halaman dan {'{total}'} untuk total halaman
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Start Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mulai dari Nomor
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={options.startNumber}
                    onChange={(e) => updateOption('startNumber', parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                {/* Appearance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ukuran Font
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="24"
                      value={options.fontSize}
                      onChange={(e) => updateOption('fontSize', parseInt(e.target.value) || 12)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warna Font
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={options.fontColor}
                        onChange={(e) => updateOption('fontColor', e.target.value)}
                        className="h-10 w-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={options.fontColor}
                        onChange={(e) => updateOption('fontColor', e.target.value)}
                        className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Margin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Margin (mm): {options.margin}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={options.margin}
                    onChange={(e) => updateOption('margin', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* Exclude Pages */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="excludeFirstPage"
                      checked={options.excludeFirstPage}
                      onChange={(e) => updateOption('excludeFirstPage', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="excludeFirstPage" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Kecualikan halaman pertama
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="excludeLastPage"
                      checked={options.excludeLastPage}
                      onChange={(e) => updateOption('excludeLastPage', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="excludeLastPage" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Kecualikan halaman terakhir
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kecualikan Halaman Tertentu
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 2, 5-7, 10"
                      value={options.excludePages}
                      onChange={(e) => updateOption('excludePages', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Pisahkan dengan koma, gunakan tanda "-" untuk rentang halaman
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview Nomor Halaman
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <div className="aspect-[3/4] bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500 relative">
                  {/* Page content placeholder */}
                  <div className="absolute inset-10 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-1/2"></div>
                  </div>
                  
                  {/* Page number preview */}
                  <div 
                    className={`absolute text-sm ${
                      options.position.startsWith('top') ? 'top-4' : 'bottom-4'
                    } ${
                      options.position.endsWith('left') ? 'left-4' : 
                      options.position.endsWith('right') ? 'right-4' : 'left-1/2 transform -translate-x-1/2'
                    }`}
                    style={{ 
                      color: options.fontColor,
                      fontSize: `${options.fontSize}px`
                    }}
                  >
                    {getPageNumberText(0, numPages || 10)}
                  </div>
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Contoh tampilan nomor halaman dengan pengaturan saat ini
                </div>
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
              <span className="text-lg">🔢</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Format Fleksibel</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Berbagai format nomor halaman yang dapat disesuaikan
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pengecualian</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Kecualikan halaman tertentu dari penomoran
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Kustomisasi</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sesuaikan ukuran, warna, dan posisi nomor halaman
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPageNumbers;