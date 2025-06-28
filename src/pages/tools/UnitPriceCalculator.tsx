import React, { useState, useEffect } from 'react';
import { ArrowLeft, Ruler, Plus, Trash2, Calculator, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  unitPrice?: number;
  status?: 'best' | 'average' | 'worst';
}

const UnitPriceCalculator: React.FC = () => {
  // State for products
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Beras Merek A', price: 25000, quantity: 5, unit: 'kg' },
    { id: '2', name: 'Beras Merek B', price: 50000, quantity: 10, unit: 'kg' }
  ]);
  
  // State for new product
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'unitPrice' | 'status'>>({
    name: '',
    price: 0,
    quantity: 0,
    unit: 'kg'
  });
  
  // State for unit conversion
  const [baseUnit, setBaseUnit] = useState<string>('kg');
  const [unitConversions, setUnitConversions] = useState<{[key: string]: number}>({
    'kg': 1,
    'gram': 0.001,
    'liter': 1,
    'ml': 0.001,
    'pcs': 1
  });
  
  // State for comparison results
  const [comparisonResults, setComparisonResults] = useState<Product[]>([]);
  
  // Calculate unit prices and comparison
  useEffect(() => {
    if (products.length === 0) {
      setComparisonResults([]);
      return;
    }
    
    // Calculate unit price for each product
    const productsWithUnitPrice = products.map(product => {
      const conversionFactor = unitConversions[product.unit] || 1;
      const unitPrice = product.price / (product.quantity * conversionFactor);
      return { ...product, unitPrice };
    });
    
    // Sort by unit price
    const sortedProducts = [...productsWithUnitPrice].sort((a, b) => 
      (a.unitPrice || 0) - (b.unitPrice || 0)
    );
    
    // Assign status
    const resultsWithStatus = sortedProducts.map((product, index) => {
      let status: 'best' | 'average' | 'worst' | undefined;
      
      if (sortedProducts.length >= 3) {
        if (index === 0) status = 'best';
        else if (index === sortedProducts.length - 1) status = 'worst';
        else status = 'average';
      } else if (sortedProducts.length === 2) {
        status = index === 0 ? 'best' : 'worst';
      } else {
        status = 'best';
      }
      
      return { ...product, status };
    });
    
    setComparisonResults(resultsWithStatus);
  }, [products, unitConversions, baseUnit]);
  
  // Add new product
  const addProduct = () => {
    if (!newProduct.name || newProduct.price <= 0 || newProduct.quantity <= 0) {
      alert('Mohon lengkapi semua field dengan benar!');
      return;
    }
    
    const newProductWithId: Product = {
      ...newProduct,
      id: Date.now().toString()
    };
    
    setProducts(prev => [...prev, newProductWithId]);
    
    // Reset form
    setNewProduct({
      name: '',
      price: 0,
      quantity: 0,
      unit: 'kg'
    });
  };
  
  // Remove product
  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
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
  
  // Get status badge class
  const getStatusBadgeClass = (status?: 'best' | 'average' | 'worst'): string => {
    switch (status) {
      case 'best':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'average':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'worst':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Get status label
  const getStatusLabel = (status?: 'best' | 'average' | 'worst'): string => {
    switch (status) {
      case 'best':
        return 'Lebih Hemat';
      case 'average':
        return 'Rata-rata';
      case 'worst':
        return 'Kurang Hemat';
      default:
        return 'Sama';
    }
  };
  
  // Export comparison
  const exportComparison = () => {
    if (comparisonResults.length === 0) {
      alert('Tidak ada perbandingan untuk diekspor!');
      return;
    }
    
    let comparisonText = "Perbandingan Harga per Unit:\n\n";
    
    comparisonResults.forEach((product, index) => {
      comparisonText += `${index + 1}. ${product.name}\n`;
      comparisonText += `   Harga: ${formatCurrency(product.price)}\n`;
      comparisonText += `   Jumlah: ${product.quantity} ${product.unit}\n`;
      comparisonText += `   Harga per ${baseUnit}: ${formatCurrency(product.unitPrice || 0)}\n`;
      comparisonText += `   Status: ${getStatusLabel(product.status)}\n\n`;
    });
    
    const blob = new Blob([comparisonText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perbandingan-harga.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4 shadow-lg shadow-blue-500/20">
            <Ruler className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Kalkulator Harga per Unit
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bandingkan harga barang berdasarkan satuan (per kg, per ml) untuk belanja lebih hemat.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 shadow-lg shadow-blue-500/10">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Cara Menggunakan:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
            <li>Masukkan nama produk (opsional)</li>
            <li>Masukkan harga produk</li>
            <li>Masukkan jumlah/berat/volume produk</li>
            <li>Pilih satuan (kg, gram, liter, ml, dll)</li>
            <li>Tambahkan produk lain untuk dibandingkan</li>
            <li>Lihat perbandingan harga per unit</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Add Product Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tambah Produk
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Produk (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Beras Merek A"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
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
                        placeholder="25000"
                        value={newProduct.price || ''}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Jumlah
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        value={newProduct.quantity || ''}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Satuan
                      </label>
                      <select 
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="kg">kg</option>
                        <option value="gram">gram</option>
                        <option value="liter">liter</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={addProduct}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Produk</span>
                </button>
              </div>
            </div>

            {/* Unit Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pengaturan Satuan
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Satuan Dasar untuk Perbandingan
                  </label>
                  <select 
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="liter">liter</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Konversi Satuan
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p>1 kg = 1000 gram</p>
                    <p>1 liter = 1000 ml</p>
                    <p>1 pcs = 1 unit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Product List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Daftar Produk ({products.length})
                </h3>
                {products.length > 0 && (
                  <button 
                    onClick={exportComparison}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200 flex items-center space-x-1 shadow-md shadow-blue-500/10"
                  >
                    <Save className="w-4 h-4" />
                    <span>Ekspor</span>
                  </button>
                )}
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Ruler className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Belum ada produk untuk dibandingkan
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {product.name || `Produk #${product.id}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(product.price)} / {product.quantity} {product.unit}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeProduct(product.id)}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparison Results */}
            {comparisonResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Hasil Perbandingan
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produk</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jumlah</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga per {baseUnit}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {comparisonResults.map((product) => (
                        <tr key={product.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{product.name || `Produk #${product.id}`}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{product.quantity} {product.unit}</td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{formatCurrency(product.unitPrice || 0)}/{baseUnit}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs font-medium ${getStatusBadgeClass(product.status)} rounded-full`}>
                              {getStatusLabel(product.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
              <span className="text-lg">🛒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belanja Cerdas</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Bandingkan produk untuk mendapatkan nilai terbaik
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Satuan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Konversi otomatis antar satuan yang berbeda
            </p>
          </div>

          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
              <span className="text-lg">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hemat Uang</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Temukan penawaran terbaik dengan perbandingan yang jelas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitPriceCalculator;