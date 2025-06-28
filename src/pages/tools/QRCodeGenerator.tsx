import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, QrCode, Download, Copy, RefreshCw, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';

const QRCodeGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [qrDataURL, setQrDataURL] = useState('');
  const [qrSize, setQrSize] = useState(256);
  const [errorLevel, setErrorLevel] = useState('M');
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // QR Code generation using qrcode library
  const generateQRCode = async () => {
    if (!inputText.trim()) {
      setQrDataURL('');
      return;
    }

    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Generate QR code
      const options = {
        errorCorrectionLevel: errorLevel,
        margin: 1,
        width: qrSize,
        color: {
          dark: foregroundColor,
          light: backgroundColor
        }
      };

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Generate QR code on canvas
      await QRCode.toCanvas(canvas, inputText, options);
      
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/png');
      setQrDataURL(dataURL);

    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Terjadi kesalahan saat membuat QR code.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate QR code when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateQRCode();
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [inputText, qrSize, errorLevel, foregroundColor, backgroundColor]);

  const copyToClipboard = async () => {
    if (!inputText.trim()) {
      alert('Tidak ada teks untuk disalin!');
      return;
    }

    try {
      await navigator.clipboard.writeText(inputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Gagal menyalin:', error);
      alert('Gagal menyalin teks');
    }
  };

  const downloadQRCode = () => {
    if (!qrDataURL) {
      alert('Generate QR code terlebih dahulu!');
      return;
    }

    const link = document.createElement('a');
    link.href = qrDataURL;
    link.download = `qrcode-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presetTexts = [
    { label: 'Website', value: 'https://example.com' },
    { label: 'Email', value: 'mailto:example@email.com' },
    { label: 'Telepon', value: 'tel:+6281234567890' },
    { label: 'SMS', value: 'sms:+6281234567890?body=Halo!' },
    { label: 'WiFi', value: 'WIFI:T:WPA;S:NetworkName;P:password;H:false;;' },
    { label: 'WhatsApp', value: 'https://wa.me/6281234567890?text=Halo!' }
  ];

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-900/20 rounded-full mb-4">
            <QrCode className="w-8 h-8 text-slate-600 dark:text-slate-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Generator Kode QR
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Buat kode QR untuk URL, teks, kontak, WiFi, dan data lainnya dengan kustomisasi lengkap.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Cara Menggunakan:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-slate-800 dark:text-slate-200">
            <li>Masukkan teks, URL, atau data yang ingin dikonversi ke QR code</li>
            <li>Pilih preset untuk format khusus (WiFi, WhatsApp, dll)</li>
            <li>Sesuaikan ukuran, warna, dan tingkat error correction</li>
            <li>QR code akan dibuat secara otomatis</li>
            <li>Unduh hasil QR code sebagai gambar PNG</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input & Settings */}
          <div className="space-y-6">
            {/* Text Input */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                1. Data QR Code
              </h3>
              
              <div className="space-y-4">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Masukkan teks, URL, atau data lainnya..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {inputText.length} karakter
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!inputText.trim()}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                2. Template Cepat
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {presetTexts.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setInputText(preset.value)}
                    className="p-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {preset.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {preset.value}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                3. Pengaturan QR Code
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ukuran (px)
                    </label>
                    <select
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={128}>128x128</option>
                      <option value={256}>256x256</option>
                      <option value={512}>512x512</option>
                      <option value={1024}>1024x1024</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Error Correction
                    </label>
                    <select
                      value={errorLevel}
                      onChange={(e) => setErrorLevel(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warna Foreground
                    </label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warna Background
                    </label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Download */}
          <div className="space-y-6">
            {/* QR Code Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview QR Code
              </h3>
              
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {qrDataURL ? (
                    <img 
                      src={qrDataURL} 
                      alt="Generated QR Code"
                      className="border border-gray-200 dark:border-gray-600 rounded-lg"
                      style={{ width: Math.min(qrSize, 300), height: Math.min(qrSize, 300) }}
                    />
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700"
                      style={{ width: 300, height: 300 }}
                    >
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {inputText.trim() ? 'Generating...' : 'QR Code akan muncul di sini'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isGenerating && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-lg">
                      <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden canvas for QR generation */}
              <canvas ref={canvasRef} className="hidden" width={qrSize} height={qrSize} />

              {/* Download Button */}
              <div className="text-center">
                <button
                  onClick={downloadQRCode}
                  disabled={!qrDataURL || isGenerating}
                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  <span>Unduh QR Code</span>
                </button>
              </div>
            </div>

            {/* QR Info */}
            {inputText.trim() && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informasi QR Code
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ukuran:</span>
                    <span className="text-gray-900 dark:text-white">{qrSize}x{qrSize} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Error Correction:</span>
                    <span className="text-gray-900 dark:text-white">{errorLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Panjang Data:</span>
                    <span className="text-gray-900 dark:text-white">{inputText.length} karakter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Format:</span>
                    <span className="text-gray-900 dark:text-white">PNG</span>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Tips */}
            <div className="bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Tips Penggunaan
              </h3>
              
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start space-x-2">
                  <Smartphone className="w-4 h-4 mt-0.5 text-slate-500" />
                  <span>Pastikan QR code cukup besar untuk dipindai dengan mudah</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 mt-0.5 text-slate-500">🎨</span>
                  <span>Gunakan kontras warna yang tinggi untuk hasil scan terbaik</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 mt-0.5 text-slate-500">🔗</span>
                  <span>URL harus lengkap dengan protokol (http:// atau https://)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 mt-0.5 text-slate-500">📱</span>
                  <span>Test QR code dengan berbagai aplikasi scanner</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Contoh Penggunaan QR Code
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Website/URL', desc: 'Link ke situs web atau halaman tertentu', icon: '🌐', example: 'https://example.com' },
              { title: 'Kontak vCard', desc: 'Informasi kontak untuk disimpan di ponsel', icon: '📱', example: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nEND:VCARD' },
              { title: 'WiFi', desc: 'Kredensial WiFi untuk koneksi otomatis', icon: '📶', example: 'WIFI:T:WPA;S:NetworkName;P:password;;' },
              { title: 'Menu Restaurant', desc: 'Menu digital tanpa sentuh', icon: '🍽️', example: 'https://restaurant.com/menu' },
              { title: 'Event', desc: 'Informasi acara dan lokasi', icon: '🎫', example: 'https://event.com/details' },
              { title: 'WhatsApp', desc: 'Chat langsung ke nomor WhatsApp', icon: '💬', example: 'https://wa.me/6281234567890?text=Halo!' }
            ].map((useCase, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="text-center">
                  <div className="text-3xl mb-3">{useCase.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {useCase.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {useCase.desc}
                  </p>
                  <button
                    onClick={() => setInputText(useCase.example)}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition-colors duration-200"
                  >
                    Gunakan Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;