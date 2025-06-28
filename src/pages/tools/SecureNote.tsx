import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Copy, Clock, RefreshCw, Key, Eye, EyeOff, Save, Link as LinkIcon, AlertTriangle, Mail, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import CryptoJS from 'crypto-js';

interface NoteOptions {
  expiryTime: string;
  password: string;
  notifyOnRead: boolean;
  email: string;
  readOnce: boolean;
}

const SecureNote: React.FC = () => {
  // State for note creation
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<NoteOptions>({
    expiryTime: 'after-read',
    password: '',
    notifyOnRead: false,
    email: '',
    readOnce: true
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // State for note reading
  const [isReadMode, setIsReadMode] = useState(false);
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [noteMetadata, setNoteMetadata] = useState<{
    createdAt: string;
    expiresAt: string | null;
    readOnce: boolean;
  } | null>(null);
  
  // State for generated link
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get location for hash
  const location = useLocation();
  
  // Check for encrypted data in URL hash
  useEffect(() => {
    const hash = location.hash.substring(1);
    if (hash) {
      try {
        // Try to parse the hash
        const parsedData = JSON.parse(atob(hash));
        if (parsedData && parsedData.data) {
          setEncryptedData(parsedData.data);
          setNoteMetadata({
            createdAt: parsedData.createdAt || new Date().toISOString(),
            expiresAt: parsedData.expiresAt || null,
            readOnce: parsedData.readOnce || false
          });
          setIsReadMode(true);
        }
      } catch (error) {
        console.error('Error parsing hash:', error);
      }
    }
  }, [location]);
  
  // Generate random password
  const generateRandomPassword = (length: number = 8) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setOptions(prev => ({ ...prev, password }));
  };
  
  // Create secure note
  const createSecureNote = () => {
    if (!message.trim()) {
      alert('Pesan tidak boleh kosong!');
      return;
    }
    
    if (options.password.length < 4) {
      alert('Password harus minimal 4 karakter!');
      return;
    }
    
    try {
      // Encrypt the message
      const encrypted = CryptoJS.AES.encrypt(message, options.password).toString();
      
      // Create metadata
      const now = new Date();
      let expiresAt: string | null = null;
      
      if (options.expiryTime !== 'after-read') {
        const expiryMap: {[key: string]: number} = {
          '1-hour': 60 * 60 * 1000,
          '12-hours': 12 * 60 * 60 * 1000,
          '1-day': 24 * 60 * 60 * 1000,
          '3-days': 3 * 24 * 60 * 60 * 1000,
          '7-days': 7 * 24 * 60 * 60 * 1000,
          '30-days': 30 * 24 * 60 * 60 * 1000
        };
        
        const expiryTime = expiryMap[options.expiryTime];
        if (expiryTime) {
          expiresAt = new Date(now.getTime() + expiryTime).toISOString();
        }
      }
      
      // Create data object
      const dataObject = {
        data: encrypted,
        createdAt: now.toISOString(),
        expiresAt,
        readOnce: options.readOnce
      };
      
      // Encode data
      const encodedData = btoa(JSON.stringify(dataObject));
      
      // Create link
      const shareUrl = `${window.location.origin}${window.location.pathname}#${encodedData}`;
      setGeneratedLink(shareUrl);
      setShowLinkModal(true);
      
    } catch (error) {
      console.error('Error creating secure note:', error);
      alert('Terjadi kesalahan saat membuat catatan rahasia.');
    }
  };
  
  // Decrypt note
  const decryptNote = () => {
    if (!encryptedData || !decryptPassword) {
      setDecryptError('Password diperlukan untuk membuka catatan ini.');
      return;
    }
    
    try {
      // Decrypt the message
      const decrypted = CryptoJS.AES.decrypt(encryptedData, decryptPassword).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        setDecryptError('Password salah atau catatan rusak.');
        return;
      }
      
      setDecryptedMessage(decrypted);
      setDecryptError('');
      
      // If note is set to be read once, remove it from URL
      if (noteMetadata?.readOnce) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
    } catch (error) {
      console.error('Error decrypting note:', error);
      setDecryptError('Password salah atau catatan rusak.');
    }
  };
  
  // Copy link to clipboard
  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Gagal menyalin link ke clipboard.');
    }
  };
  
  // Create new note
  const createNewNote = () => {
    setIsReadMode(false);
    setEncryptedData('');
    setDecryptPassword('');
    setDecryptedMessage('');
    setDecryptError('');
    setNoteMetadata(null);
    setMessage('');
    setOptions({
      expiryTime: 'after-read',
      password: '',
      notifyOnRead: false,
      email: '',
      readOnce: true
    });
    window.history.replaceState(null, '', window.location.pathname);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if note is expired
  const isNoteExpired = (): boolean => {
    if (!noteMetadata) return false;
    
    if (noteMetadata.expiresAt) {
      const expiryDate = new Date(noteMetadata.expiresAt);
      return expiryDate < new Date();
    }
    
    return false;
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4 shadow-lg shadow-purple-500/20">
            <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Catatan Rahasia Terenkripsi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Kirim pesan rahasia yang aman dan bisa hancur sendiri setelah dibaca.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8 shadow-lg shadow-purple-500/10">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            Cara Kerja:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-purple-800 dark:text-purple-200">
            <li>Tulis pesan rahasia Anda di bawah ini</li>
            <li>Atur opsi keamanan (password, waktu kadaluarsa)</li>
            <li>Klik "Buat Catatan Rahasia" untuk mengenkripsi pesan</li>
            <li>Salin dan bagikan link yang dihasilkan kepada penerima</li>
            <li>Pesan akan terhapus secara permanen setelah dibaca atau kadaluarsa</li>
          </ol>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6">
            <button 
              onClick={() => setIsReadMode(false)}
              className={`px-4 py-2 text-sm font-medium ${
                !isReadMode
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Buat Catatan Rahasia
            </button>
            <button 
              onClick={() => setIsReadMode(true)}
              className={`px-4 py-2 text-sm font-medium ${
                isReadMode
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Baca Catatan Rahasia
            </button>
          </div>

          {/* Create Secret Note */}
          {!isReadMode && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pesan Rahasia
                </label>
                <textarea
                  placeholder="Ketik pesan rahasia Anda di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password (Wajib)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Buat password untuk pesan ini"
                      value={options.password}
                      onChange={(e) => setOptions(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-20 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        <Key className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Password ini akan diperlukan untuk membuka pesan
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waktu Kadaluarsa
                  </label>
                  <select 
                    value={options.expiryTime}
                    onChange={(e) => setOptions(prev => ({ ...prev, expiryTime: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="after-read">Setelah dibaca</option>
                    <option value="1-hour">1 jam</option>
                    <option value="12-hours">12 jam</option>
                    <option value="1-day">1 hari</option>
                    <option value="3-days">3 hari</option>
                    <option value="7-days">7 hari</option>
                    <option value="30-days">30 hari</option>
                  </select>
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="read-once"
                    checked={options.readOnce}
                    onChange={(e) => setOptions(prev => ({ ...prev, readOnce: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="read-once" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Hancurkan pesan setelah dibaca (sekali baca)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notify-on-read"
                    checked={options.notifyOnRead}
                    onChange={(e) => setOptions(prev => ({ ...prev, notifyOnRead: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="notify-on-read" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Kirim notifikasi email saat pesan dibaca
                  </label>
                </div>
                
                {options.notifyOnRead && (
                  <div className="mt-3 ml-6">
                    <input
                      type="email"
                      placeholder="Masukkan alamat email Anda"
                      value={options.email}
                      onChange={(e) => setOptions(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              
              <button 
                onClick={createSecureNote}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30"
              >
                <Lock className="w-5 h-5" />
                <span>Buat Catatan Rahasia</span>
              </button>
            </div>
          )}

          {/* Read Secret Note */}
          {isReadMode && (
            <div className="space-y-6">
              {encryptedData ? (
                decryptedMessage ? (
                  // Decrypted message view
                  <div className="space-y-6">
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800 shadow-lg shadow-purple-500/10">
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                        Pesan Rahasia
                      </h3>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-purple-100 dark:border-purple-800 whitespace-pre-wrap">
                        {decryptedMessage}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm">
                      <div className="flex items-center space-x-2 mb-2 text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Peringatan Keamanan</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Pesan ini telah didekripsi dan mungkin telah dihapus dari server. Jika Anda perlu menyimpan informasi ini, salin sekarang.
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(decryptedMessage)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                      >
                        <Copy className="w-3 h-3 inline mr-1" />
                        Salin Pesan
                      </button>
                    </div>
                    
                    <button
                      onClick={createNewNote}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-purple-500/30"
                    >
                      Buat Catatan Baru
                    </button>
                  </div>
                ) : (
                  // Password input view
                  <div className="space-y-6">
                    {isNoteExpired() ? (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                          Catatan Telah Kadaluarsa
                        </h3>
                        <p className="text-red-600 dark:text-red-400">
                          Catatan ini telah melewati batas waktu dan tidak dapat lagi diakses.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                            Buka Catatan Rahasia
                          </h3>
                          
                          {noteMetadata && (
                            <div className="mb-4 text-sm text-purple-700 dark:text-purple-300">
                              <p>Dibuat pada: {formatDate(noteMetadata.createdAt)}</p>
                              {noteMetadata.expiresAt && (
                                <p>Kadaluarsa pada: {formatDate(noteMetadata.expiresAt)}</p>
                              )}
                              {noteMetadata.readOnce && (
                                <p className="font-medium">Catatan ini akan hancur setelah dibaca.</p>
                              )}
                            </div>
                          )}
                          
                          <div className="space-y-4">
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Masukkan password untuk membuka catatan"
                                value={decryptPassword}
                                onChange={(e) => setDecryptPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            
                            {decryptError && (
                              <div className="text-red-500 text-sm">
                                {decryptError}
                              </div>
                            )}
                            
                            <button
                              onClick={decryptNote}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-purple-500/30"
                            >
                              Buka Catatan
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <button
                            onClick={createNewNote}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium"
                          >
                            Buat Catatan Baru
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              ) : (
                // No encrypted data view
                <div className="text-center py-8">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                      <LinkIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Buka Catatan Rahasia
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Untuk membuka catatan rahasia, Anda perlu mengakses link yang dibagikan kepada Anda. Link tersebut berisi data terenkripsi yang diperlukan.
                    </p>
                    <button
                      onClick={() => setIsReadMode(false)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-purple-500/30"
                    >
                      Buat Catatan Baru
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Enkripsi End-to-End</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Pesan dienkripsi di browser Anda, kami tidak bisa membacanya
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">⏱️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Self-Destruct</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Pesan terhapus otomatis setelah dibaca atau kadaluarsa
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">🔑</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Password Protection</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tambahkan lapisan keamanan ekstra dengan password
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-lg">📱</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notifikasi</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Dapatkan notifikasi saat pesan Anda dibaca
            </p>
          </div>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Catatan Rahasia Berhasil Dibuat!
            </h3>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Link Rahasia:
                </div>
                <button 
                  onClick={copyLinkToClipboard}
                  className="p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-purple-800 dark:text-purple-200 font-mono text-sm mt-1 break-all">
                {generatedLink}
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {options.expiryTime === 'after-read' 
                    ? 'Kadaluarsa setelah dibaca' 
                    : `Kadaluarsa dalam ${
                        options.expiryTime === '1-hour' ? '1 jam' :
                        options.expiryTime === '12-hours' ? '12 jam' :
                        options.expiryTime === '1-day' ? '1 hari' :
                        options.expiryTime === '3-days' ? '3 hari' :
                        options.expiryTime === '7-days' ? '7 hari' :
                        '30 hari'
                      }`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Dilindungi dengan enkripsi end-to-end</span>
              </div>
              {options.notifyOnRead && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Notifikasi akan dikirim ke {options.email}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <button 
                  onClick={createNewNote}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Buat Catatan Baru</span>
                </button>
                
                <button 
                  onClick={copyLinkToClipboard}
                  className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-800/30 text-purple-700 dark:text-purple-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-md shadow-purple-500/10"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureNote;