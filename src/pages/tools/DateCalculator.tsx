import React, { useState, useEffect } from 'react';
import { ArrowLeft, CalendarClock, Calculator, Plus, Minus, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DateDifference {
  days: number;
  months: number;
  years: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  weekdays: number;
  weekends: number;
}

interface DateAddResult {
  resultDate: Date;
  dayOfWeek: string;
  weekOfYear: number;
}

interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  nextBirthday: {
    date: Date;
    daysRemaining: number;
  };
}

// List of holidays in Indonesia (simplified for example)
const holidays = [
  { name: "Tahun Baru", date: "2025-01-01" },
  { name: "Imlek", date: "2025-01-29" },
  { name: "Isra Miraj", date: "2025-02-15" },
  { name: "Nyepi", date: "2025-03-21" },
  { name: "Wafat Isa Almasih", date: "2025-04-18" },
  { name: "Hari Buruh", date: "2025-05-01" },
  { name: "Hari Raya Idul Fitri", date: "2025-05-02" },
  { name: "Hari Raya Idul Fitri", date: "2025-05-03" },
  { name: "Kenaikan Isa Almasih", date: "2025-05-29" },
  { name: "Hari Lahir Pancasila", date: "2025-06-01" },
  { name: "Idul Adha", date: "2025-07-09" },
  { name: "Tahun Baru Hijriyah", date: "2025-07-29" },
  { name: "Hari Kemerdekaan", date: "2025-08-17" },
  { name: "Maulid Nabi", date: "2025-10-05" },
  { name: "Hari Natal", date: "2025-12-25" }
];

const DateCalculator: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'difference' | 'add' | 'workdays' | 'age'>('difference');
  
  // State for date difference calculator
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [includeEndDate, setIncludeEndDate] = useState<boolean>(true);
  const [dateDifference, setDateDifference] = useState<DateDifference | null>(null);
  
  // State for date add/subtract calculator
  const [baseDate, setBaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState<number>(30);
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('days');
  const [dateAddResult, setDateAddResult] = useState<DateAddResult | null>(null);
  
  // State for workdays calculator
  const [workdaysStartDate, setWorkdaysStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workdaysEndDate, setWorkdaysEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [excludeWeekends, setExcludeWeekends] = useState<boolean>(true);
  const [excludeHolidays, setExcludeHolidays] = useState<boolean>(true);
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);
  const [newCustomHoliday, setNewCustomHoliday] = useState<string>('');
  const [workdaysResult, setWorkdaysResult] = useState<{
    workdays: number;
    weekends: number;
    holidays: number;
    totalDays: number;
  } | null>(null);
  
  // State for age calculator
  const [birthDate, setBirthDate] = useState<string>('');
  const [referenceDate, setReferenceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ageResult, setAgeResult] = useState<AgeResult | null>(null);

  // Calculate date difference
  const calculateDateDifference = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }
    
    // Adjust end date if including end date
    const adjustedEnd = includeEndDate 
      ? new Date(end.getTime() + 24 * 60 * 60 * 1000) 
      : end;
    
    // Calculate total days difference
    const diffTime = Math.abs(adjustedEnd.getTime() - start.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate years, months, days
    let years = adjustedEnd.getFullYear() - start.getFullYear();
    let months = adjustedEnd.getMonth() - start.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Calculate remaining days
    const yearMonthDate = new Date(start);
    yearMonthDate.setFullYear(yearMonthDate.getFullYear() + years);
    yearMonthDate.setMonth(yearMonthDate.getMonth() + months);
    
    const diffDays = Math.floor(
      (adjustedEnd.getTime() - yearMonthDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate weekdays and weekends
    let weekdays = 0;
    let weekends = 0;
    
    const tempDate = new Date(start);
    while (tempDate < adjustedEnd) {
      const day = tempDate.getDay();
      if (day === 0 || day === 6) {
        weekends++;
      } else {
        weekdays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    setDateDifference({
      days: diffDays,
      months,
      years,
      totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      totalMonths: years * 12 + months + (diffDays > 0 ? diffDays / 30 : 0),
      weekdays,
      weekends
    });
  };
  
  // Calculate date after adding/subtracting
  const calculateDateAddSubtract = () => {
    const date = new Date(baseDate);
    
    if (isNaN(date.getTime())) {
      return;
    }
    
    const multiplier = operation === 'add' ? 1 : -1;
    
    switch (unit) {
      case 'days':
        date.setDate(date.getDate() + (amount * multiplier));
        break;
      case 'weeks':
        date.setDate(date.getDate() + (amount * 7 * multiplier));
        break;
      case 'months':
        date.setMonth(date.getMonth() + (amount * multiplier));
        break;
      case 'years':
        date.setFullYear(date.getFullYear() + (amount * multiplier));
        break;
    }
    
    // Get day of week
    const dayOfWeek = date.toLocaleDateString('id-ID', { weekday: 'long' });
    
    // Get week of year (approximate)
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekOfYear = Math.ceil(days / 7);
    
    setDateAddResult({
      resultDate: date,
      dayOfWeek,
      weekOfYear
    });
  };
  
  // Calculate workdays
  const calculateWorkdays = () => {
    const start = new Date(workdaysStartDate);
    const end = new Date(workdaysEndDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }
    
    // Calculate total days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include end date
    
    let workdays = 0;
    let weekends = 0;
    let holidayCount = 0;
    
    // Combine built-in holidays and custom holidays
    const allHolidays = [
      ...holidays.map(h => h.date),
      ...customHolidays
    ];
    
    // Loop through each day
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const dateString = tempDate.toISOString().split('T')[0];
      const day = tempDate.getDay();
      
      // Check if it's a weekend
      if (day === 0 || day === 6) {
        if (excludeWeekends) {
          weekends++;
        } else {
          workdays++;
        }
      } 
      // Check if it's a holiday
      else if (excludeHolidays && allHolidays.includes(dateString)) {
        holidayCount++;
      } 
      // It's a workday
      else {
        workdays++;
      }
      
      // Move to next day
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    setWorkdaysResult({
      workdays,
      weekends,
      holidays: holidayCount,
      totalDays
    });
  };
  
  // Add custom holiday
  const addCustomHoliday = () => {
    if (!newCustomHoliday) return;
    
    setCustomHolidays(prev => [...prev, newCustomHoliday]);
    setNewCustomHoliday('');
  };
  
  // Remove custom holiday
  const removeCustomHoliday = (date: string) => {
    setCustomHolidays(prev => prev.filter(holiday => holiday !== date));
  };
  
  // Calculate age
  const calculateAge = () => {
    if (!birthDate) return;
    
    const birth = new Date(birthDate);
    const reference = new Date(referenceDate);
    
    if (isNaN(birth.getTime()) || isNaN(reference.getTime())) {
      return;
    }
    
    // Calculate total days
    const diffTime = reference.getTime() - birth.getTime();
    if (diffTime < 0) {
      alert('Tanggal lahir tidak boleh lebih besar dari tanggal referensi!');
      return;
    }
    
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate years, months, days
    let years = reference.getFullYear() - birth.getFullYear();
    let months = reference.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && reference.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    
    // Calculate remaining days
    let days = reference.getDate() - birth.getDate();
    if (days < 0) {
      // Get the last day of the previous month
      const lastMonth = new Date(reference.getFullYear(), reference.getMonth(), 0);
      days += lastMonth.getDate();
      months--;
      if (months < 0) {
        months += 12;
        years--;
      }
    }
    
    // Calculate next birthday
    const nextBirthday = new Date(reference.getFullYear(), birth.getMonth(), birth.getDate());
    if (
      nextBirthday.getTime() < reference.getTime() ||
      (nextBirthday.getMonth() === reference.getMonth() && nextBirthday.getDate() === reference.getDate())
    ) {
      nextBirthday.setFullYear(reference.getFullYear() + 1);
    }
    
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
    
    setAgeResult({
      years,
      months,
      days,
      totalDays,
      nextBirthday: {
        date: nextBirthday,
        daysRemaining: daysUntilBirthday
      }
    });
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Calculate on input change
  useEffect(() => {
    if (activeTab === 'difference') {
      calculateDateDifference();
    } else if (activeTab === 'add') {
      calculateDateAddSubtract();
    } else if (activeTab === 'workdays') {
      calculateWorkdays();
    } else if (activeTab === 'age' && birthDate) {
      calculateAge();
    }
  }, [
    activeTab, 
    startDate, endDate, includeEndDate,
    baseDate, operation, amount, unit,
    workdaysStartDate, workdaysEndDate, excludeWeekends, excludeHolidays, customHolidays,
    birthDate, referenceDate
  ]);

  return (
    <div className="min-h-screen py-8">
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 dark:bg-teal-900/20 rounded-full mb-4 shadow-lg shadow-teal-500/20">
            <CalendarClock className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Kalkulator Durasi & Tanggal
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hitung selisih antar tanggal, hari kerja, atau tanggal di masa depan/masa lalu.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-6 mb-8 shadow-lg shadow-teal-500/10">
          <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100 mb-3">
            Fitur Kalkulator Tanggal:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-teal-800 dark:text-teal-200">
            <li>Hitung selisih hari, bulan, dan tahun antara dua tanggal</li>
            <li>Tambah atau kurangi hari, bulan, atau tahun dari tanggal tertentu</li>
            <li>Hitung hari kerja antara dua tanggal (tidak termasuk akhir pekan dan hari libur)</li>
            <li>Hitung usia berdasarkan tanggal lahir</li>
            <li>Konversi tanggal ke berbagai format</li>
          </ul>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6">
            <button 
              onClick={() => setActiveTab('difference')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'difference'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Selisih Tanggal
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'add'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Tambah/Kurang Tanggal
            </button>
            <button 
              onClick={() => setActiveTab('workdays')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'workdays'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Hari Kerja
            </button>
            <button 
              onClick={() => setActiveTab('age')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'age'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Kalkulator Usia
            </button>
          </div>

          {/* Date Difference Calculator */}
          {activeTab === 'difference' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Awal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Termasuk Tanggal Akhir
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="include-end-date"
                      checked={includeEndDate}
                      onChange={(e) => setIncludeEndDate(e.target.checked)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="include-end-date" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Ya, sertakan tanggal akhir dalam perhitungan
                    </label>
                  </div>
                </div>
                
                <button 
                  onClick={calculateDateDifference}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/30"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Hitung Selisih</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {dateDifference && (
                  <>
                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-800 shadow-lg shadow-teal-500/10">
                      <div className="text-center">
                        <div className="text-sm text-teal-700 dark:text-teal-300 mb-1">
                          Selisih Tanggal
                        </div>
                        <div className="text-3xl font-bold text-teal-800 dark:text-teal-200">
                          {dateDifference.totalDays.toLocaleString()} hari
                        </div>
                        <div className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                          ({dateDifference.years} tahun, {dateDifference.months} bulan, {dateDifference.days} hari)
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-md">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Hari</span>
                          <span className="text-gray-900 dark:text-white font-medium">{dateDifference.totalDays.toLocaleString()} hari</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Minggu</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {Math.floor(dateDifference.totalDays / 7).toLocaleString()} minggu, {dateDifference.totalDays % 7} hari
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Bulan</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {dateDifference.totalMonths.toFixed(1)} bulan
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Hari Kerja</span>
                          <span className="text-gray-900 dark:text-white font-medium">{dateDifference.weekdays.toLocaleString()} hari</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Akhir Pekan</span>
                          <span className="text-gray-900 dark:text-white font-medium">{dateDifference.weekends.toLocaleString()} hari</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Add/Subtract Date Calculator */}
          {activeTab === 'add' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Awal
                  </label>
                  <input
                    type="date"
                    value={baseDate}
                    onChange={(e) => setBaseDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Operasi
                    </label>
                    <div className="flex">
                      <button 
                        onClick={() => setOperation('add')}
                        className={`flex-1 p-2 ${
                          operation === 'add'
                            ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                        } rounded-l`}
                      >
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                      <button 
                        onClick={() => setOperation('subtract')}
                        className={`flex-1 p-2 ${
                          operation === 'subtract'
                            ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                        } rounded-r`}
                      >
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jumlah
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as 'days' | 'weeks' | 'months' | 'years')}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="days">Hari</option>
                      <option value="weeks">Minggu</option>
                      <option value="months">Bulan</option>
                      <option value="years">Tahun</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  onClick={calculateDateAddSubtract}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/30"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Hitung Tanggal</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {dateAddResult && (
                  <>
                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-800 shadow-lg shadow-teal-500/10">
                      <div className="text-center">
                        <div className="text-sm text-teal-700 dark:text-teal-300 mb-1">
                          Hasil Tanggal
                        </div>
                        <div className="text-3xl font-bold text-teal-800 dark:text-teal-200">
                          {formatDate(dateAddResult.resultDate)}
                        </div>
                        <div className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                          (Setelah {operation === 'add' ? 'menambahkan' : 'mengurangi'} {amount} {
                            unit === 'days' ? 'hari' : 
                            unit === 'weeks' ? 'minggu' : 
                            unit === 'months' ? 'bulan' : 'tahun'
                          })
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-md">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tanggal Awal</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {new Date(baseDate).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Operasi</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {operation === 'add' ? 'Tambah' : 'Kurang'} {amount} {
                              unit === 'days' ? 'hari' : 
                              unit === 'weeks' ? 'minggu' : 
                              unit === 'months' ? 'bulan' : 'tahun'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Hari dalam Minggu</span>
                          <span className="text-gray-900 dark:text-white font-medium">{dateAddResult.dayOfWeek}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Minggu dalam Tahun</span>
                          <span className="text-gray-900 dark:text-white font-medium">Minggu ke-{dateAddResult.weekOfYear}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Workdays Calculator */}
          {activeTab === 'workdays' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Awal
                  </label>
                  <input
                    type="date"
                    value={workdaysStartDate}
                    onChange={(e) => setWorkdaysStartDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={workdaysEndDate}
                    onChange={(e) => setWorkdaysEndDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="exclude-weekends"
                      checked={excludeWeekends}
                      onChange={(e) => setExcludeWeekends(e.target.checked)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="exclude-weekends" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Kecualikan akhir pekan (Sabtu & Minggu)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="exclude-holidays"
                      checked={excludeHolidays}
                      onChange={(e) => setExcludeHolidays(e.target.checked)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="exclude-holidays" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Kecualikan hari libur nasional
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tambah Hari Libur Kustom
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={newCustomHoliday}
                      onChange={(e) => setNewCustomHoliday(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      onClick={addCustomHoliday}
                      disabled={!newCustomHoliday}
                      className="px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {customHolidays.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hari Libur Kustom
                    </label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {customHolidays.map((holiday, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(holiday).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <button
                            onClick={() => removeCustomHoliday(holiday)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={calculateWorkdays}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/30"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Hitung Hari Kerja</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {workdaysResult && (
                  <>
                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-800 shadow-lg shadow-teal-500/10">
                      <div className="text-center">
                        <div className="text-sm text-teal-700 dark:text-teal-300 mb-1">
                          Jumlah Hari Kerja
                        </div>
                        <div className="text-3xl font-bold text-teal-800 dark:text-teal-200">
                          {workdaysResult.workdays.toLocaleString()} hari
                        </div>
                        <div className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                          dari total {workdaysResult.totalDays.toLocaleString()} hari
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-md">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Hari</span>
                          <span className="text-gray-900 dark:text-white font-medium">{workdaysResult.totalDays.toLocaleString()} hari</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Hari Kerja</span>
                          <span className="text-gray-900 dark:text-white font-medium">{workdaysResult.workdays.toLocaleString()} hari</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Akhir Pekan</span>
                          <span className="text-gray-900 dark:text-white font-medium">{workdaysResult.weekends.toLocaleString()} hari</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Hari Libur</span>
                          <span className="text-gray-900 dark:text-white font-medium">{workdaysResult.holidays.toLocaleString()} hari</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-md">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Periode
                      </h4>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Dari</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(workdaysStartDate).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Sampai</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(workdaysEndDate).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Age Calculator */}
          {activeTab === 'age' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Referensi (Default: Hari Ini)
                  </label>
                  <input
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <button 
                  onClick={calculateAge}
                  disabled={!birthDate}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/30"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Hitung Usia</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {ageResult && (
                  <>
                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-800 shadow-lg shadow-teal-500/10">
                      <div className="text-center">
                        <div className="text-sm text-teal-700 dark:text-teal-300 mb-1">
                          Usia Saat Ini
                        </div>
                        <div className="text-3xl font-bold text-teal-800 dark:text-teal-200">
                          {ageResult.years} tahun, {ageResult.months} bulan, {ageResult.days} hari
                        </div>
                        <div className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                          ({ageResult.totalDays.toLocaleString()} hari total)
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-md">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tanggal Lahir</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {new Date(birthDate).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tanggal Referensi</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {new Date(referenceDate).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Usia dalam Tahun</span>
                          <span className="text-gray-900 dark:text-white font-medium">{ageResult.years} tahun</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Usia dalam Bulan</span>
                          <span className="text-gray-900 dark:text-white font-medium">{ageResult.years * 12 + ageResult.months} bulan</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Usia dalam Hari</span>
                          <span className="text-gray-900 dark:text-white font-medium">{ageResult.totalDays.toLocaleString()} hari</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 shadow-md">
                      <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Ulang Tahun Berikutnya
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-600 dark:text-blue-400">Tanggal</span>
                          <span className="text-blue-800 dark:text-blue-200 font-medium">
                            {formatDate(ageResult.nextBirthday.date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 dark:text-blue-400">Usia</span>
                          <span className="text-blue-800 dark:text-blue-200 font-medium">
                            {ageResult.years + 1} tahun
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 dark:text-blue-400">Sisa Hari</span>
                          <span className="text-blue-800 dark:text-blue-200 font-medium">
                            {ageResult.nextBirthday.daysRemaining} hari lagi
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Kalkulator</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              4 kalkulator tanggal dalam 1 tool
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Hasil kalkulasi instan saat Anda memilih tanggal
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Detail Lengkap</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Hasil dalam hari, minggu, bulan, dan tahun
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20">
              <span className="text-lg">💼</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hari Kerja</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Hitung hari kerja dengan mengecualikan akhir pekan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateCalculator;