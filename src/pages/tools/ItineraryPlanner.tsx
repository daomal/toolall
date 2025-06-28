import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Plus, Clock, MapPin, Trash2, Download, Share2, Save } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Activity {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

interface Day {
  date: string;
  activities: Activity[];
}

interface Itinerary {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  days: Day[];
}

const ItineraryPlanner: React.FC = () => {
  // State for itinerary
  const [itinerary, setItinerary] = useState<Itinerary>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days: []
  });
  
  // State for new activity
  const [newActivity, setNewActivity] = useState<{
    name: string;
    date: string;
    time: string;
    location: string;
    notes: string;
  }>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    notes: ''
  });
  
  // State for sharing
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Navigation and location hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for PDF export
  const itineraryRef = useRef<HTMLDivElement>(null);
  
  // Initialize days when start/end dates change
  useEffect(() => {
    if (itinerary.startDate && itinerary.endDate) {
      const start = new Date(itinerary.startDate);
      const end = new Date(itinerary.endDate);
      
      if (start > end) {
        // If start date is after end date, adjust end date
        setItinerary(prev => ({
          ...prev,
          endDate: itinerary.startDate
        }));
        return;
      }
      
      // Generate days between start and end dates
      const days: Day[] = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if this day already exists
        const existingDay = itinerary.days.find(day => day.date === dateString);
        
        if (existingDay) {
          days.push(existingDay);
        } else {
          days.push({
            date: dateString,
            activities: []
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setItinerary(prev => ({
        ...prev,
        days
      }));
      
      // Update new activity date if needed
      if (!days.some(day => day.date === newActivity.date)) {
        setNewActivity(prev => ({
          ...prev,
          date: days[0]?.date || itinerary.startDate
        }));
      }
    }
  }, [itinerary.startDate, itinerary.endDate]);
  
  // Check for shared itinerary in URL hash
  useEffect(() => {
    const hash = location.hash.substring(1); // Remove the # character
    
    if (hash) {
      try {
        // Decode and parse the hash
        const decodedHash = atob(hash);
        const parsedItinerary = JSON.parse(decodedHash);
        
        if (parsedItinerary && parsedItinerary.title) {
          setItinerary(parsedItinerary);
        }
      } catch (error) {
        console.error('Error parsing shared itinerary:', error);
      }
    }
  }, [location]);
  
  // Update itinerary
  const updateItinerary = <K extends keyof Itinerary>(key: K, value: Itinerary[K]) => {
    setItinerary(prev => ({ ...prev, [key]: value }));
  };
  
  // Add new activity
  const addActivity = () => {
    if (!newActivity.name.trim() || !newActivity.date || !newActivity.time) return;
    
    const newActivityObj: Activity = {
      id: Date.now().toString(),
      name: newActivity.name.trim(),
      date: newActivity.date,
      time: newActivity.time,
      location: newActivity.location.trim(),
      notes: newActivity.notes.trim()
    };
    
    // Find the day to add the activity to
    setItinerary(prev => {
      const updatedDays = prev.days.map(day => {
        if (day.date === newActivity.date) {
          // Add activity to this day
          return {
            ...day,
            activities: [...day.activities, newActivityObj].sort((a, b) => a.time.localeCompare(b.time))
          };
        }
        return day;
      });
      
      return {
        ...prev,
        days: updatedDays
      };
    });
    
    // Reset new activity form
    setNewActivity({
      name: '',
      date: newActivity.date,
      time: '',
      location: '',
      notes: ''
    });
  };
  
  // Remove activity
  const removeActivity = (activityId: string) => {
    setItinerary(prev => {
      const updatedDays = prev.days.map(day => ({
        ...day,
        activities: day.activities.filter(activity => activity.id !== activityId)
      }));
      
      return {
        ...prev,
        days: updatedDays
      };
    });
  };
  
  // Add new day
  const addDay = () => {
    if (itinerary.days.length === 0) return;
    
    // Get the last day
    const lastDay = itinerary.days[itinerary.days.length - 1];
    
    // Create a new date one day after the last day
    const lastDate = new Date(lastDay.date);
    lastDate.setDate(lastDate.getDate() + 1);
    const newDate = lastDate.toISOString().split('T')[0];
    
    // Update end date and days
    setItinerary(prev => ({
      ...prev,
      endDate: newDate,
      days: [
        ...prev.days,
        {
          date: newDate,
          activities: []
        }
      ]
    }));
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Share itinerary
  const shareItinerary = () => {
    // Encode itinerary as base64
    const itineraryJson = JSON.stringify(itinerary);
    const encodedItinerary = btoa(itineraryJson);
    
    // Create URL with hash
    const shareUrl = `${window.location.origin}${window.location.pathname}#${encodedItinerary}`;
    setShareUrl(shareUrl);
    setShowShareModal(true);
    
    // Update URL without reloading
    navigate(`#${encodedItinerary}`, { replace: true });
  };
  
  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link itinerary berhasil disalin ke clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Gagal menyalin link. URL: ' + shareUrl);
    }
  };
  
  // Export to PDF
  const exportToPDF = async () => {
    if (!itineraryRef.current || !itinerary.title) {
      alert('Harap isi judul itinerary terlebih dahulu!');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const element = itineraryRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to maintain aspect ratio
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text(itinerary.title, 105, 15, { align: 'center' });
      
      // Add date range
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const dateRange = `${formatDate(itinerary.startDate)} - ${formatDate(itinerary.endDate)}`;
      pdf.text(dateRange, 105, 25, { align: 'center' });
      
      // Add description if available
      if (itinerary.description) {
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(itinerary.description, 105, 35, { align: 'center', maxWidth: 180 });
      }
      
      let heightLeft = imgHeight;
      let position = 45; // Start position after title and description
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);
      
      // Add new pages if needed
      while (heightLeft > 0) {
        position = 0;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -pageHeight + position + imgHeight, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save PDF
      pdf.save(`${itinerary.title.replace(/\s+/g, '_')}_itinerary.pdf`);
      setExportSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Terjadi kesalahan saat mengekspor ke PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4 shadow-lg shadow-blue-500/20">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Visual Itinerary Planner
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Buat jadwal visual acara/perjalanan yang bisa dibagikan dengan mudah.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 shadow-lg shadow-blue-500/10">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Fitur Itinerary Planner:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
            <li>Buat jadwal perjalanan dengan tampilan visual yang menarik</li>
            <li>Tambahkan aktivitas dengan waktu, lokasi, dan catatan</li>
            <li>Atur jadwal dengan mudah dan intuitif</li>
            <li>Ekspor ke PDF untuk dibagikan atau dicetak</li>
            <li>Bagikan link itinerary untuk kolaborasi</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trip Details */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detail Perjalanan
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Judul Perjalanan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Liburan ke Bali"
                    value={itinerary.title}
                    onChange={(e) => updateItinerary('title', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={itinerary.startDate}
                      onChange={(e) => updateItinerary('startDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={itinerary.endDate}
                      onChange={(e) => updateItinerary('endDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi (Opsional)
                  </label>
                  <textarea
                    placeholder="Deskripsi singkat tentang perjalanan ini..."
                    value={itinerary.description}
                    onChange={(e) => updateItinerary('description', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Add Activity Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tambah Aktivitas
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Aktivitas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Check-in Hotel"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal
                  </label>
                  <select
                    value={newActivity.date}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {itinerary.days.map(day => (
                      <option key={day.date} value={day.date}>
                        {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Waktu Mulai
                    </label>
                    <input
                      type="time"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Hotel Mulia, Bali"
                      value={newActivity.location}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    placeholder="Detail tambahan tentang aktivitas ini..."
                    value={newActivity.notes}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button 
                  onClick={addActivity}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Aktivitas</span>
                </button>
              </div>
            </div>

            {/* Share & Export */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bagikan & Ekspor
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={shareItinerary}
                  disabled={!itinerary.title}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Bagikan Link</span>
                </button>
                
                <button 
                  onClick={exportToPDF}
                  disabled={!itinerary.title || isExporting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-green-500/30"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Mengekspor...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Ekspor ke PDF</span>
                    </>
                  )}
                </button>
                
                {exportSuccess && (
                  <div className="text-center text-sm text-green-600 dark:text-green-400 mt-2 animate-fade-in">
                    PDF berhasil diunduh!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Column - Itinerary Timeline */}
          <div className="lg:col-span-2">
            <div ref={itineraryRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {itinerary.title || 'Jadwal Perjalanan'}
                </h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={shareItinerary}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                  >
                    Bagikan Link
                  </button>
                  <button 
                    onClick={exportToPDF}
                    className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors duration-200 shadow-md shadow-green-500/10"
                  >
                    Ekspor PDF
                  </button>
                </div>
              </div>
              
              {itinerary.days.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Pilih tanggal mulai dan selesai untuk membuat jadwal
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {itinerary.days.map((day, dayIndex) => (
                    <div key={day.date} className="mb-8">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium shadow-md shadow-blue-500/10">
                          Hari {dayIndex + 1} - {formatDate(day.date)}
                        </div>
                      </div>
                      
                      {day.activities.length === 0 ? (
                        <div className="pl-8 text-gray-500 dark:text-gray-400 text-sm italic">
                          Belum ada aktivitas untuk hari ini
                        </div>
                      ) : (
                        <div className="relative pl-8 border-l-2 border-blue-200 dark:border-blue-800 space-y-6">
                          {day.activities.map((activity) => (
                            <div key={activity.id} className="relative">
                              <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"></div>
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{activity.name}</h4>
                                    <div className="flex items-center space-x-4 mt-2 text-sm">
                                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>{activity.time}</span>
                                      </div>
                                      {activity.location && (
                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                          <MapPin className="w-4 h-4 mr-1" />
                                          <span>{activity.location}</span>
                                        </div>
                                      )}
                                    </div>
                                    {activity.notes && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        {activity.notes}
                                      </p>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => removeActivity(activity.id)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Day Button */}
                  <div className="mt-6 text-center">
                    <button 
                      onClick={addDay}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 shadow-md shadow-blue-500/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Hari Baru</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bagikan Itinerary
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Salin link di bawah ini untuk membagikan itinerary Anda dengan orang lain:
              </p>
              
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={copyShareUrl}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Visual Timeline</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tampilan jadwal yang intuitif dan mudah dipahami
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mudah Digunakan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tambah, edit, dan hapus aktivitas dengan mudah
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">📤</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ekspor & Bagikan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ekspor jadwal sebagai PDF atau bagikan via link
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-lg">💾</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Auto-save</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Perubahan disimpan otomatis di browser Anda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryPlanner;