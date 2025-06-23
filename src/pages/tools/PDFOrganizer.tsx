import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowUpDown, Upload, Download, RotateCw, RotateCcw, Trash2, Eye, X, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPage {
  id: string;
  pageNumber: number;
  rotation: number;
  thumbnail: string | null;
}

const PDFOrganizer: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [previewPage, setPreviewPage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedPdfDocument, setLoadedPdfDocument] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      pages.forEach(page => {
        if (page.thumbnail) {
          URL.revokeObjectURL(page.thumbnail);
        }
      });
    };
  }, [pdfUrl, pages]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Hanya file PDF yang diperbolehkan!');
      return;
    }

    setError(null);
    setPdfFile(file);
    
    // Create URL for the PDF file
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    
    // Reset pages
    setPages([]);
    setNumPages(null);
    setPreviewPage(null);
    setLoadedPdfDocument(null);
  };

  const onDocumentLoadSuccess = (pdfDocument: any) => {
    const numPages = pdfDocument.numPages;
    setNumPages(numPages);
    // Store the loaded PDF document for later use
    setLoadedPdfDocument(pdfDocument);
    generatePageThumbnails(numPages, pdfDocument);
  };

  const generatePageThumbnails = async (numPages: number, pdfDocument?: any) => {
    if (!pdfUrl) return;
    
    setIsGeneratingThumbnails(true);
    
    try {
      // Create page objects
      const newPages: PDFPage[] = [];
      
      for (let i = 0; i < numPages; i++) {
        newPages.push({
          id: `page-${i}`,
          pageNumber: i + 1,
          rotation: 0,
          thumbnail: null
        });
      }
      
      setPages(newPages);
      
      // Generate thumbnails using the loaded PDF document or load it fresh
      const pdf = pdfDocument || await pdfjs.getDocument(pdfUrl).promise;
      
      for (let i = 0; i < numPages; i++) {
        const canvas = document.createElement('canvas');
        const page = await pdf.getPage(i + 1);
        
        const viewport = page.getViewport({ scale: 0.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const context = canvas.getContext('2d');
        if (!context) continue;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const thumbnail = canvas.toDataURL('image/png');
        
        setPages(prevPages => 
          prevPages.map((p, index) => 
            index === i ? { ...p, thumbnail } : p
          )
        );
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      setError('Terjadi kesalahan saat memproses PDF. Pastikan file tidak rusak.');
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  const rotatePage = (pageId: string, direction: 'clockwise' | 'counterclockwise') => {
    setPages(prevPages => 
      prevPages.map(page => {
        if (page.id === pageId) {
          const currentRotation = page.rotation;
          const rotationChange = direction === 'clockwise' ? 90 : -90;
          // Normalize rotation to be between 0 and 270 degrees
          const newRotation = ((currentRotation + rotationChange) % 360 + 360) % 360;
          return { ...page, rotation: newRotation };
        }
        return page;
      })
    );
  };

  const deletePage = (pageId: string) => {
    setPages(prevPages => prevPages.filter(page => page.id !== pageId));
    if (previewPage !== null) {
      setPreviewPage(null);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPages(items);
  };

  const previewPageHandler = (pageNumber: number) => {
    setPreviewPage(pageNumber);
  };

  const closePreview = () => {
    setPreviewPage(null);
  };

  const processPDF = async () => {
    if (!pdfFile || pages.length === 0) {
      setError('Tidak ada file PDF yang dipilih atau semua halaman telah dihapus.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Load original PDF
      const pdfBytes = await pdfFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(pdfBytes);
      
      // Create a new PDF document
      const newPdf = await PDFDocument.create();
      
      // Copy pages in the new order with rotations
      for (const page of pages) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [page.pageNumber - 1]);
        
        // Apply rotation if needed
        if (page.rotation !== 0) {
          copiedPage.setRotation(degrees(page.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }
      
      // Save the new PDF
      const modifiedPdfBytes = await newPdf.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      
      // Generate a filename
      const originalName = pdfFile.name;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const newFileName = `${baseName}-modified.pdf`;
      
      saveAs(blob, newFileName);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      setError('Terjadi kesalahan saat memproses PDF. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <ArrowUpDown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pengatur PDF (Organize PDF)
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ubah urutan, putar, dan hapus halaman dalam PDF Anda dengan mudah.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Fitur Pengatur PDF:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
            <li>Ubah urutan halaman dengan drag & drop</li>
            <li>Putar halaman 90°, 180°, atau 270°</li>
            <li>Hapus halaman yang tidak diperlukan</li>
            <li>Preview setiap halaman sebelum menyimpan</li>
            <li>Unduh PDF yang sudah diatur ulang</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* File Upload */}
        {!pdfFile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 mb-6">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Unggah File PDF
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Pilih file PDF yang ingin Anda atur ulang
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                Pilih File PDF
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* PDF Organizer Interface */}
        {pdfFile && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    File Terpilih:
                  </h3>
                  <p className="font-medium text-gray-900 dark:text-white">{pdfFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {numPages ? `${numPages} halaman • ${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Memuat...'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setPdfFile(null);
                      setPdfUrl(null);
                      setPages([]);
                      setNumPages(null);
                      setLoadedPdfDocument(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* PDF Document for initial loading */}
            <div className="hidden">
              {pdfFile && (
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => {
                    console.error('Error loading PDF:', error);
                    setError('Terjadi kesalahan saat memuat PDF. Pastikan file tidak rusak.');
                  }}
                >
                  {/* This is just for loading the document, not for display */}
                </Document>
              )}
            </div>

            {/* Page Thumbnails */}
            {isGeneratingThumbnails ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Memuat halaman PDF...</p>
                </div>
              </div>
            ) : pages.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Atur Halaman ({pages.length})
                </h3>
                
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="pages" direction="horizontal">
                    {(provided) => (
                      <div 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {pages.map((page, index) => (
                          <Draggable key={page.id} draggableId={page.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col"
                              >
                                {/* Thumbnail */}
                                <div className="relative">
                                  <div 
                                    className="aspect-[3/4] bg-white dark:bg-gray-600 flex items-center justify-center overflow-hidden"
                                    style={{ 
                                      transform: `rotate(${page.rotation}deg)`,
                                      transition: 'transform 0.3s ease'
                                    }}
                                  >
                                    {page.thumbnail ? (
                                      <img 
                                        src={page.thumbnail} 
                                        alt={`Page ${page.pageNumber}`}
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    ) : (
                                      <div className="text-2xl font-bold text-gray-400">
                                        {page.pageNumber}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Preview button */}
                                  <button
                                    onClick={() => previewPageHandler(page.pageNumber)}
                                    className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                  >
                                    <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  </button>
                                </div>
                                
                                {/* Page info and controls */}
                                <div className="p-3 border-t border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center justify-between mb-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                      Halaman {page.pageNumber}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <button
                                      onClick={() => rotatePage(page.id, 'counterclockwise')}
                                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                                      title="Putar ke kiri"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => rotatePage(page.id, 'clockwise')}
                                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                                      title="Putar ke kanan"
                                    >
                                      <RotateCw className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deletePage(page.id)}
                                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                      title="Hapus halaman"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            ) : null}

            {/* Process Button */}
            {pages.length > 0 && (
              <div className="text-center">
                <button
                  onClick={processPDF}
                  disabled={isProcessing || pages.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Unduh PDF Hasil Pengaturan</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Page Preview Modal */}
            {previewPage !== null && pdfFile && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Preview Halaman {previewPage}
                    </h3>
                    <button
                      onClick={closePreview}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                    <Document
                      file={pdfFile}
                      onLoadError={(error) => {
                        console.error('Error loading PDF for preview:', error);
                        setError('Terjadi kesalahan saat memuat preview PDF.');
                      }}
                    >
                      <Page 
                        pageNumber={previewPage} 
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="max-w-full"
                        scale={1.2}
                      />
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
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mudah Digunakan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Interface drag & drop yang intuitif untuk mengatur halaman
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">👁️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Preview Langsung</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lihat perubahan secara real-time sebelum mengunduh
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Privasi Terjamin</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Semua proses dilakukan di browser, tanpa upload ke server
            </p>
          </div>
        </div>

        {/* Hidden canvas for thumbnail generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default PDFOrganizer;