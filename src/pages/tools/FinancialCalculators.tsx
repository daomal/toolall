import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Percent, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DiscountCalculation {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

interface VATCalculation {
  originalPrice: number;
  vatPercent: number;
  vatAmount: number;
  finalPrice: number;
  excludeVAT: boolean;
}

interface PercentageCalculation {
  value1: number;
  value2: number;
  percentageOf: number;
  percentageChange: number;
  increaseDecrease: string;
}

interface MarginCalculation {
  cost: number;
  sellingPrice: number;
  margin: number;
  markup: number;
  profit: number;
}

const FinancialCalculators: React.FC = () => {
  // State for active calculator
  const [activeCalculator, setActiveCalculator] = useState<'discount' | 'vat' | 'percentage' | 'margin'>('discount');
  
  // State for discount calculator
  const [discountInput, setDiscountInput] = useState({
    originalPrice: 100000,
    discountPercent: 20
  });
  const [discountResult, setDiscountResult] = useState<DiscountCalculation | null>(null);
  
  // State for VAT calculator
  const [vatInput, setVatInput] = useState({
    originalPrice: 100000,
    vatPercent: 11,
    excludeVAT: false
  });
  const [vatResult, setVatResult] = useState<VATCalculation | null>(null);
  
  // State for percentage calculator
  const [percentageInput, setPercentageInput] = useState({
    value1: 100,
    value2: 125
  });
  const [percentageResult, setPercentageResult] = useState<PercentageCalculation | null>(null);
  
  // State for margin calculator
  const [marginInput, setMarginInput] = useState({
    cost: 80000,
    sellingPrice: 100000
  });
  const [marginResult, setMarginResult] = useState<MarginCalculation | null>(null);
  
  // Calculate discount
  const calculateDiscount = () => {
    const { originalPrice, discountPercent } = discountInput;
    
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;
    
    setDiscountResult({
      originalPrice,
      discountPercent,
      discountAmount,
      finalPrice
    });
  };
  
  // Calculate VAT
  const calculateVAT = () => {
    const { originalPrice, vatPercent, excludeVAT } = vatInput;
    
    let vatAmount: number;
    let finalPrice: number;
    
    if (excludeVAT) {
      // VAT is added to the original price
      vatAmount = (originalPrice * vatPercent) / 100;
      finalPrice = originalPrice + vatAmount;
    } else {
      // VAT is included in the original price
      vatAmount = originalPrice - (originalPrice / (1 + vatPercent / 100));
      finalPrice = originalPrice;
    }
    
    setVatResult({
      originalPrice,
      vatPercent,
      vatAmount,
      finalPrice,
      excludeVAT
    });
  };
  
  // Calculate percentage
  const calculatePercentage = () => {
    const { value1, value2 } = percentageInput;
    
    // Calculate percentage of value1 to value2
    const percentageOf = (value1 / value2) * 100;
    
    // Calculate percentage change from value1 to value2
    const percentageChange = Math.abs(((value2 - value1) / value1) * 100);
    
    // Determine if it's an increase or decrease
    const increaseDecrease = value2 > value1 ? 'increase' : value2 < value1 ? 'decrease' : 'no change';
    
    setPercentageResult({
      value1,
      value2,
      percentageOf,
      percentageChange,
      increaseDecrease
    });
  };
  
  // Calculate margin
  const calculateMargin = () => {
    const { cost, sellingPrice } = marginInput;
    
    const profit = sellingPrice - cost;
    const margin = (profit / sellingPrice) * 100;
    const markup = (profit / cost) * 100;
    
    setMarginResult({
      cost,
      sellingPrice,
      margin,
      markup,
      profit
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };
  
  // Calculate results when inputs change
  useEffect(() => {
    switch (activeCalculator) {
      case 'discount':
        calculateDiscount();
        break;
      case 'vat':
        calculateVAT();
        break;
      case 'percentage':
        calculatePercentage();
        break;
      case 'margin':
        calculateMargin();
        break;
    }
  }, [activeCalculator, discountInput, vatInput, percentageInput, marginInput]);

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4 shadow-lg shadow-green-500/20">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Kalkulator Finansial
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hitung diskon, PPN, persentase, dan margin dengan cepat dan akurat.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6">
            <button 
              onClick={() => setActiveCalculator('discount')}
              className={`px-4 py-2 text-sm font-medium ${
                activeCalculator === 'discount'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Kalkulator Diskon
            </button>
            <button 
              onClick={() => setActiveCalculator('vat')}
              className={`px-4 py-2 text-sm font-medium ${
                activeCalculator === 'vat'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Kalkulator PPN
            </button>
            <button 
              onClick={() => setActiveCalculator('percentage')}
              className={`px-4 py-2 text-sm font-medium ${
                activeCalculator === 'percentage'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Kalkulator Persentase
            </button>
            <button 
              onClick={() => setActiveCalculator('margin')}
              className={`px-4 py-2 text-sm font-medium ${
                activeCalculator === 'margin'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Kalkulator Margin
            </button>
          </div>

          {/* Discount Calculator */}
          {activeCalculator === 'discount' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Asli
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">Rp</span>
                    </div>
                    <input
                      type="number"
                      placeholder="100000"
                      value={discountInput.originalPrice || ''}
                      onChange={(e) => setDiscountInput(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Diskon (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="20"
                      value={discountInput.discountPercent || ''}
                      onChange={(e) => setDiscountInput(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={calculateDiscount}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-green-500/30"
              >
                Hitung
              </button>

              {discountResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-md">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Jumlah Diskon</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(discountResult.discountAmount)}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-md shadow-green-500/10">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">Harga Setelah Diskon</div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(discountResult.finalPrice)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VAT Calculator */}
          {activeCalculator === 'vat' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">Rp</span>
                    </div>
                    <input
                      type="number"
                      placeholder="100000"
                      value={vatInput.originalPrice || ''}
                      onChange={(e) => setVatInput(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PPN (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="11"
                      value={vatInput.vatPercent || ''}
                      onChange={(e) => setVatInput(prev => ({ ...prev, vatPercent: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="exclude-vat"
                  checked={vatInput.excludeVAT}
                  onChange={(e) => setVatInput(prev => ({ ...prev, excludeVAT: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="exclude-vat" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Harga belum termasuk PPN (tambahkan PPN)
                </label>
              </div>

              <button 
                onClick={calculateVAT}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-green-500/30"
              >
                Hitung
              </button>

              {vatResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-md">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Jumlah PPN</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(vatResult.vatAmount)}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-md shadow-green-500/10">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                      {vatResult.excludeVAT ? 'Harga Termasuk PPN' : 'Harga Tanpa PPN'}
                    </div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                      {vatResult.excludeVAT 
                        ? formatCurrency(vatResult.finalPrice) 
                        : formatCurrency(vatResult.originalPrice - vatResult.vatAmount)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Percentage Calculator */}
          {activeCalculator === 'percentage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nilai 1
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={percentageInput.value1 || ''}
                    onChange={(e) => setPercentageInput(prev => ({ ...prev, value1: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nilai 2
                  </label>
                  <input
                    type="number"
                    placeholder="125"
                    value={percentageInput.value2 || ''}
                    onChange={(e) => setPercentageInput(prev => ({ ...prev, value2: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button 
                onClick={calculatePercentage}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-green-500/30"
              >
                Hitung
              </button>

              {percentageResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-md">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Persentase Nilai 1 dari Nilai 2</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatPercentage(percentageResult.percentageOf)}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-md shadow-green-500/10">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                      {percentageResult.increaseDecrease === 'increase' 
                        ? 'Persentase Kenaikan' 
                        : percentageResult.increaseDecrease === 'decrease' 
                          ? 'Persentase Penurunan' 
                          : 'Persentase Perubahan'}
                    </div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                      {formatPercentage(percentageResult.percentageChange)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Margin Calculator */}
          {activeCalculator === 'margin' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Modal
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">Rp</span>
                    </div>
                    <input
                      type="number"
                      placeholder="80000"
                      value={marginInput.cost || ''}
                      onChange={(e) => setMarginInput(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Jual
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">Rp</span>
                    </div>
                    <input
                      type="number"
                      placeholder="100000"
                      value={marginInput.sellingPrice || ''}
                      onChange={(e) => setMarginInput(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={calculateMargin}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-green-500/30"
              >
                Hitung
              </button>

              {marginResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-md">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(marginResult.profit)}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-md shadow-green-500/10">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">Margin</div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">{formatPercentage(marginResult.margin)}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 shadow-md shadow-blue-500/10">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Markup</div>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatPercentage(marginResult.markup)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Kalkulator</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              4 kalkulator finansial dalam 1 tool
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Hasil kalkulasi instan saat Anda mengetik
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Akurat</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Perhitungan presisi untuk kebutuhan finansial Anda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialCalculators;