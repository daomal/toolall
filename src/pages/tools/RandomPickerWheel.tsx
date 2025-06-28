import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCw, Plus, Trash2, Download, RefreshCw, Shuffle, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WheelItem {
  id: string;
  name: string;
  color: string;
  selected?: boolean;
}

const RandomPickerWheel: React.FC = () => {
  // State for wheel items
  const [items, setItems] = useState<WheelItem[]>([
    { id: '1', name: 'Budi', color: '#f87171' },
    { id: '2', name: 'Siti', color: '#fbbf24' },
    { id: '3', name: 'Ahmad', color: '#34d399' },
    { id: '4', name: 'Dewi', color: '#60a5fa' },
    { id: '5', name: 'Rudi', color: '#a78bfa' },
    { id: '6', name: 'Lina', color: '#f472b6' }
  ]);
  
  // State for new item
  const [newItemName, setNewItemName] = useState<string>('');
  
  // State for wheel animation
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [spinHistory, setSpinHistory] = useState<{ time: Date; winner: string; id: string }[]>([]);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [removeAfterSpin, setRemoveAfterSpin] = useState<boolean>(true);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinAngleRef = useRef<number>(0);
  const spinAngleStartRef = useRef<number>(0);
  const spinTimeRef = useRef<number>(0);
  const spinTimeTotalRef = useRef<number>(0);
  
  // Colors for new items
  const colors = [
    '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6',
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  
  // Draw the wheel
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set wheel properties
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Filter out selected items if needed
    const activeItems = items.filter(item => !item.selected);
    
    if (activeItems.length === 0) {
      // Draw empty wheel with message
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Semua item telah dipilih', centerX, centerY - 20);
      ctx.fillText('Klik reset untuk mulai ulang', centerX, centerY + 20);
      return;
    }
    
    // Draw wheel segments
    const arc = (2 * Math.PI) / activeItems.length;
    
    for (let i = 0; i < activeItems.length; i++) {
      const angle = spinAngleRef.current + i * arc;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      
      ctx.fillStyle = activeItems[i].color;
      ctx.fill();
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      
      // Draw text
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      
      // Adjust text position based on segment size
      const textRadius = radius * 0.75;
      ctx.fillText(activeItems[i].name, textRadius, 5);
      
      ctx.restore();
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cccccc';
    ctx.stroke();
    
    // Draw center text
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSpinning ? 'Spinning...' : 'Spin', centerX, centerY);
    
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 10, centerY - radius + 10);
    ctx.lineTo(centerX + 10, centerY - radius + 10);
    ctx.closePath();
    ctx.fillStyle = '#e11d48';
    ctx.fill();
  };
  
  // Spin the wheel
  const spinWheel = () => {
    if (isSpinning || items.filter(item => !item.selected).length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);
    setShowCelebration(false);
    
    // Reset spin angle
    spinAngleStartRef.current = Math.random() * 10 + 10;
    spinTimeRef.current = 0;
    spinTimeTotalRef.current = Math.random() * 3 + 4 * 1000; // 4-7 seconds
    
    rotateWheel();
  };
  
  // Rotate the wheel
  const rotateWheel = () => {
    spinTimeRef.current += 30;
    
    if (spinTimeRef.current >= spinTimeTotalRef.current) {
      stopRotateWheel();
      return;
    }
    
    // Easing function
    const spinAngle = spinAngleStartRef.current - easeOut(spinTimeRef.current, 0, spinAngleStartRef.current, spinTimeTotalRef.current);
    spinAngleRef.current += (spinAngle * Math.PI / 180);
    
    drawWheel();
    
    spinTimeoutRef.current = setTimeout(rotateWheel, 30);
  };
  
  // Stop wheel rotation
  const stopRotateWheel = () => {
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
    
    // Get active items (not selected)
    const activeItems = items.filter(item => !item.selected);
    
    if (activeItems.length === 0) {
      setIsSpinning(false);
      return;
    }
    
    // Determine the winner
    const degrees = spinAngleRef.current * 180 / Math.PI + 90;
    const arcd = 360 / activeItems.length;
    const index = Math.floor((360 - (degrees % 360)) / arcd);
    const winnerItem = activeItems[index % activeItems.length];
    
    // Mark the winner as selected if removeAfterSpin is true
    if (removeAfterSpin) {
      setItems(prev => prev.map(item => 
        item.id === winnerItem.id ? { ...item, selected: true } : item
      ));
    }
    
    setWinner(winnerItem);
    setIsSpinning(false);
    
    // Show celebration and winner modal
    setShowCelebration(true);
    setShowWinnerModal(true);
    
    // Add to history
    setSpinHistory(prev => [
      { time: new Date(), winner: winnerItem.name, id: winnerItem.id },
      ...prev
    ]);
    
    drawWheel();
    
    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };
  
  // Easing function
  const easeOut = (t: number, b: number, c: number, d: number) => {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
  };
  
  // Add new item
  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: WheelItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      color: colors[items.length % colors.length]
    };
    
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
  };
  
  // Remove item
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Shuffle items
  const shuffleItems = () => {
    setItems(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };
  
  // Reset wheel
  const resetWheel = () => {
    setItems([
      { id: '1', name: 'Budi', color: '#f87171' },
      { id: '2', name: 'Siti', color: '#fbbf24' },
      { id: '3', name: 'Ahmad', color: '#34d399' },
      { id: '4', name: 'Dewi', color: '#60a5fa' },
      { id: '5', name: 'Rudi', color: '#a78bfa' },
      { id: '6', name: 'Lina', color: '#f472b6' }
    ]);
    setWinner(null);
    setSpinHistory([]);
    setShowCelebration(false);
  };
  
  // Reset selection
  const resetSelection = () => {
    setItems(prev => prev.map(item => ({ ...item, selected: false })));
    setWinner(null);
  };
  
  // Import items from text
  const importItems = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return;
    
    const newItems: WheelItem[] = lines.map((line, index) => ({
      id: Date.now() + index.toString(),
      name: line.trim(),
      color: colors[index % colors.length]
    }));
    
    setItems(newItems);
  };
  
  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Export history
  const exportHistory = () => {
    if (spinHistory.length === 0) {
      alert('Belum ada riwayat undian!');
      return;
    }
    
    let historyText = "Riwayat Undian:\n\n";
    
    spinHistory.forEach((record, index) => {
      historyText += `${index + 1}. ${record.winner} - ${record.time.toLocaleDateString('id-ID')} ${formatTime(record.time)}\n`;
    });
    
    const blob = new Blob([historyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'riwayat-undian.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Initialize wheel
  useEffect(() => {
    drawWheel();
  }, [items]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  // Confetti effect
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 100 }).map((_, i) => {
          const size = Math.random() * 10 + 5;
          const left = Math.random() * 100;
          const animationDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 0.5;
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={i}
              className="absolute top-0 animate-confetti"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                animationDuration: `${animationDuration}s`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full mb-4 shadow-lg shadow-rose-500/20">
            <RotateCw className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Roda Undian / Pemilih Acak
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Roda putar untuk mengundi nama, hadiah, atau pilihan secara acak dan menyenangkan.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-6 mb-8 shadow-lg shadow-rose-500/10">
          <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100 mb-3">
            Cara Menggunakan:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-rose-800 dark:text-rose-200">
            <li>Tambahkan daftar nama, hadiah, atau pilihan lainnya</li>
            <li>Kustomisasi warna roda jika diinginkan</li>
            <li>Klik tombol "Putar Roda" untuk memulai undian</li>
            <li>Tunggu hingga roda berhenti untuk melihat pemenang</li>
            <li>Pemenang akan otomatis dihapus dari roda (opsional)</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Entries */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daftar Pilihan
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Tambah nama atau pilihan"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <button 
                    onClick={addItem}
                    className="p-2 bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded hover:bg-rose-200 dark:hover:bg-rose-800/30 transition-colors duration-200 shadow-md shadow-rose-500/10"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-2 rounded ${
                        item.selected 
                          ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 line-through' 
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                      style={{ borderLeft: `4px solid ${item.color}` }}
                    >
                      <span className={`${item.selected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {item.name}
                      </span>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Aksi Cepat
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remove-after-spin"
                    checked={removeAfterSpin}
                    onChange={(e) => setRemoveAfterSpin(e.target.checked)}
                    className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="remove-after-spin" className="text-sm text-gray-700 dark:text-gray-300">
                    Hapus item setelah terpilih
                  </label>
                </div>
                
                <button 
                  onClick={shuffleItems}
                  className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Acak Urutan</span>
                </button>
                
                <button 
                  onClick={resetSelection}
                  className="w-full bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-800/30 text-blue-700 dark:text-blue-300 py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md shadow-blue-500/10"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Pilihan</span>
                </button>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Import dari Teks
                  </label>
                  <textarea
                    placeholder="Masukkan daftar nama, satu per baris"
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    onChange={(e) => importItems(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={resetWheel}
                  className="w-full bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 py-2 px-4 rounded-lg font-medium transition-colors duration-200 shadow-md shadow-red-500/10"
                >
                  Reset Semua
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Template
              </h3>
              
              <div className="space-y-2">
                <button 
                  onClick={() => importItems("Hadiah Utama\nHadiah Kedua\nHadiah Ketiga\nHadiah Hiburan\nHadiah Hiburan\nHadiah Hiburan")}
                  className="w-full text-left p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 shadow-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-white">Hadiah Doorprize</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">6 hadiah</div>
                </button>
                
                <button 
                  onClick={() => importItems("Merah\nJingga\nKuning\nHijau\nBiru\nNila\nUngu")}
                  className="w-full text-left p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 shadow-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-white">Warna Pelangi</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">7 warna</div>
                </button>
                
                <button 
                  onClick={() => importItems("Senin\nSelasa\nRabu\nKamis\nJumat\nSabtu\nMinggu")}
                  className="w-full text-left p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 shadow-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-white">Hari dalam Seminggu</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">7 hari</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Wheel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Roda Undian
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {items.filter(item => !item.selected).length} item aktif
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                {/* Wheel Canvas */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
                  <canvas 
                    ref={canvasRef} 
                    width={320} 
                    height={320} 
                    className="w-full h-full cursor-pointer"
                    onClick={spinWheel}
                  />
                </div>
                
                <button 
                  onClick={spinWheel}
                  disabled={isSpinning || items.filter(item => !item.selected).length === 0}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg shadow-rose-500/30"
                >
                  <RotateCw className="w-5 h-5" />
                  <span>{isSpinning ? 'Memutar...' : 'Putar Roda'}</span>
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Hasil Undian
              </h3>
              
              {winner ? (
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-6 border border-rose-200 dark:border-rose-800 mb-4 shadow-lg shadow-rose-500/10">
                  <div className="text-center">
                    <div className="text-sm text-rose-700 dark:text-rose-300 mb-1">
                      Pemenang
                    </div>
                    <div className="text-3xl font-bold text-rose-800 dark:text-rose-200">
                      {winner.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 mb-4 text-center shadow-md">
                  <p className="text-gray-500 dark:text-gray-400">
                    Putar roda untuk melihat pemenang
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Peserta</span>
                  <span className="text-gray-900 dark:text-white font-medium">{items.length} item</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Belum Terpilih</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {items.filter(item => !item.selected).length} item
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Peluang Menang</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {items.filter(item => !item.selected).length > 0 
                      ? `${(100 / items.filter(item => !item.selected).length).toFixed(2)}%` 
                      : '0%'}
                  </span>
                </div>
              </div>
              
              {spinHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Riwayat Undian
                    </h4>
                    <button
                      onClick={exportHistory}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                    >
                      <Save className="w-3 h-3 inline mr-1" />
                      Ekspor
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {spinHistory.map((record, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{formatTime(record.time)}</span>
                        <span className="text-gray-900 dark:text-white">{record.winner}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Adil & Acak</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Algoritma pengacakan yang benar-benar adil
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Kustomisasi</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sesuaikan warna dan tampilan roda
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Riwayat</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Simpan riwayat hasil undian
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-lg">🎮</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Interaktif</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Animasi putar yang menarik dan interaktif
            </p>
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {showWinnerModal && winner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-bounce-in">
            <h3 className="text-2xl font-bold text-center text-rose-600 dark:text-rose-400 mb-4">
              Selamat!
            </h3>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {winner.name}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                telah terpilih sebagai pemenang!
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowWinnerModal(false)}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors duration-200 shadow-lg shadow-rose-500/30"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Effect */}
      {showCelebration && <Confetti />}
    </div>
  );
};

export default RandomPickerWheel;