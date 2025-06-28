import React, { useState, useEffect } from 'react';
import { ArrowLeft, Utensils, Calculator, Plus, Trash2, Info, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
}

interface UserProfile {
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: 'lose' | 'maintain' | 'gain';
}

interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieGoal: number;
  caloriesRemaining: number;
  proteinGoalPercentage: number;
  carbsGoalPercentage: number;
  fatGoalPercentage: number;
}

// Food database (simplified)
const foodDatabase: FoodItem[] = [
  { id: '1', name: 'Nasi Putih (1 porsi)', calories: 204, protein: 4.2, carbs: 44, fat: 0.4, quantity: 1, unit: 'porsi' },
  { id: '2', name: 'Ayam Goreng (1 potong)', calories: 260, protein: 31, carbs: 0, fat: 14, quantity: 1, unit: 'potong' },
  { id: '3', name: 'Telur Rebus (1 butir)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, quantity: 1, unit: 'butir' },
  { id: '4', name: 'Tempe Goreng (1 potong)', calories: 118, protein: 11, carbs: 6.2, fat: 6.4, quantity: 1, unit: 'potong' },
  { id: '5', name: 'Tahu Goreng (1 potong)', calories: 78, protein: 8.5, carbs: 1.9, fat: 5, quantity: 1, unit: 'potong' },
  { id: '6', name: 'Sayur Bayam (1 mangkuk)', calories: 41, protein: 3.5, carbs: 6.8, fat: 0.5, quantity: 1, unit: 'mangkuk' },
  { id: '7', name: 'Apel (1 buah)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, quantity: 1, unit: 'buah' },
  { id: '8', name: 'Pisang (1 buah)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, quantity: 1, unit: 'buah' },
  { id: '9', name: 'Susu Full Cream (1 gelas)', calories: 146, protein: 8, carbs: 11, fat: 8, quantity: 1, unit: 'gelas' },
  { id: '10', name: 'Roti Tawar (1 lembar)', calories: 80, protein: 2.5, carbs: 15, fat: 1, quantity: 1, unit: 'lembar' },
  { id: '11', name: 'Mie Instan (1 bungkus)', calories: 380, protein: 7, carbs: 54, fat: 14, quantity: 1, unit: 'bungkus' },
  { id: '12', name: 'Nasi Goreng (1 porsi)', calories: 320, protein: 8, carbs: 45, fat: 12, quantity: 1, unit: 'porsi' },
  { id: '13', name: 'Soto Ayam (1 mangkuk)', calories: 270, protein: 18, carbs: 30, fat: 9, quantity: 1, unit: 'mangkuk' },
  { id: '14', name: 'Gado-gado (1 porsi)', calories: 300, protein: 13, carbs: 28, fat: 16, quantity: 1, unit: 'porsi' },
  { id: '15', name: 'Bakso (1 mangkuk)', calories: 350, protein: 20, carbs: 35, fat: 14, quantity: 1, unit: 'mangkuk' },
  { id: '16', name: 'Sate Ayam (5 tusuk)', calories: 310, protein: 26, carbs: 12, fat: 18, quantity: 1, unit: 'porsi' },
  { id: '17', name: 'Rendang (1 porsi)', calories: 340, protein: 25, carbs: 7, fat: 24, quantity: 1, unit: 'porsi' },
  { id: '18', name: 'Bubur Ayam (1 porsi)', calories: 220, protein: 10, carbs: 35, fat: 5, quantity: 1, unit: 'porsi' },
  { id: '19', name: 'Kopi Hitam (1 cangkir)', calories: 2, protein: 0.1, carbs: 0, fat: 0, quantity: 1, unit: 'cangkir' },
  { id: '20', name: 'Teh Manis (1 gelas)', calories: 60, protein: 0, carbs: 15, fat: 0, quantity: 1, unit: 'gelas' },
  { id: '21', name: 'Es Teh (1 gelas)', calories: 70, protein: 0, carbs: 18, fat: 0, quantity: 1, unit: 'gelas' },
  { id: '22', name: 'Jus Jeruk (1 gelas)', calories: 110, protein: 1.5, carbs: 26, fat: 0.5, quantity: 1, unit: 'gelas' },
  { id: '23', name: 'Air Mineral (1 botol)', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: 1, unit: 'botol' },
  { id: '24', name: 'Kerupuk (5 buah)', calories: 65, protein: 1, carbs: 10, fat: 2.5, quantity: 1, unit: 'porsi' },
  { id: '25', name: 'Sambal (1 sendok)', calories: 15, protein: 0.5, carbs: 3, fat: 0.2, quantity: 1, unit: 'sendok' }
];

const CalorieCalculator: React.FC = () => {
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    gender: 'male',
    age: 30,
    weight: 70,
    height: 170,
    activityLevel: 'moderate',
    goal: 'maintain'
  });
  
  // Food tracking state
  const [consumedFoods, setConsumedFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [customFood, setCustomFood] = useState<Omit<FoodItem, 'id'>>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    quantity: 1,
    unit: 'porsi'
  });
  const [showAddCustomFood, setShowAddCustomFood] = useState(false);
  
  // Nutrition summary
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    calorieGoal: 0,
    caloriesRemaining: 0,
    proteinGoalPercentage: 25,
    carbsGoalPercentage: 50,
    fatGoalPercentage: 25
  });
  
  // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
  const calculateBMR = (): number => {
    const { gender, age, weight, height } = userProfile;
    
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };
  
  // Calculate TDEE (Total Daily Energy Expenditure)
  const calculateTDEE = (): number => {
    const bmr = calculateBMR();
    const { activityLevel } = userProfile;
    
    const activityMultipliers = {
      sedentary: 1.2,      // Little or no exercise
      light: 1.375,        // Light exercise 1-3 days/week
      moderate: 1.55,      // Moderate exercise 3-5 days/week
      active: 1.725,       // Hard exercise 6-7 days/week
      'very-active': 1.9   // Very hard exercise & physical job
    };
    
    return Math.round(bmr * activityMultipliers[activityLevel]);
  };
  
  // Calculate calorie goal based on TDEE and user goal
  const calculateCalorieGoal = (): number => {
    const tdee = calculateTDEE();
    const { goal } = userProfile;
    
    switch (goal) {
      case 'lose':
        return Math.round(tdee * 0.8); // 20% deficit
      case 'maintain':
        return tdee;
      case 'gain':
        return Math.round(tdee * 1.15); // 15% surplus
      default:
        return tdee;
    }
  };
  
  // Update nutrition summary
  useEffect(() => {
    const totalCalories = consumedFoods.reduce((sum, food) => sum + (food.calories * food.quantity), 0);
    const totalProtein = consumedFoods.reduce((sum, food) => sum + (food.protein * food.quantity), 0);
    const totalCarbs = consumedFoods.reduce((sum, food) => sum + (food.carbs * food.quantity), 0);
    const totalFat = consumedFoods.reduce((sum, food) => sum + (food.fat * food.quantity), 0);
    
    const calorieGoal = calculateCalorieGoal();
    const caloriesRemaining = calorieGoal - totalCalories;
    
    setNutritionSummary({
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      calorieGoal,
      caloriesRemaining,
      proteinGoalPercentage: 25, // Default macro split
      carbsGoalPercentage: 50,
      fatGoalPercentage: 25
    });
  }, [consumedFoods, userProfile]);
  
  // Search food database
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const results = foodDatabase.filter(food => 
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(results);
  }, [searchTerm]);
  
  // Add food to consumed foods
  const addFoodToConsumed = (food: FoodItem) => {
    setConsumedFoods(prev => [...prev, { ...food, id: Date.now().toString() }]);
    setSearchTerm('');
    setShowSearchResults(false);
  };
  
  // Add custom food
  const addCustomFood = () => {
    if (!customFood.name || customFood.calories <= 0) {
      alert('Nama dan kalori wajib diisi!');
      return;
    }
    
    const newFood: FoodItem = {
      ...customFood,
      id: Date.now().toString()
    };
    
    setConsumedFoods(prev => [...prev, newFood]);
    setCustomFood({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      quantity: 1,
      unit: 'porsi'
    });
    setShowAddCustomFood(false);
  };
  
  // Remove food from consumed foods
  const removeFood = (id: string) => {
    setConsumedFoods(prev => prev.filter(food => food.id !== id));
  };
  
  // Update food quantity
  const updateFoodQuantity = (id: string, quantity: number) => {
    setConsumedFoods(prev => 
      prev.map(food => 
        food.id === id ? { ...food, quantity } : food
      )
    );
  };
  
  // Format number with 1 decimal place
  const formatNumber = (num: number): string => {
    return num.toFixed(1);
  };
  
  // Get activity level label
  const getActivityLevelLabel = (level: string): string => {
    switch (level) {
      case 'sedentary': return 'Tidak Aktif (Jarang Olahraga)';
      case 'light': return 'Sedikit Aktif (1-3 hari/minggu)';
      case 'moderate': return 'Cukup Aktif (3-5 hari/minggu)';
      case 'active': return 'Sangat Aktif (6-7 hari/minggu)';
      case 'very-active': return 'Ekstra Aktif (Atlet/Pekerja Fisik)';
      default: return level;
    }
  };
  
  // Get goal label
  const getGoalLabel = (goal: string): string => {
    switch (goal) {
      case 'lose': return 'Menurunkan Berat Badan';
      case 'maintain': return 'Mempertahankan Berat Badan';
      case 'gain': return 'Menaikkan Berat Badan';
      default: return goal;
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Kalkulator Kalori
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hitung kebutuhan kalori harian dan lacak asupan makanan Anda.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Cara Menggunakan Kalkulator Kalori
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-orange-800 dark:text-orange-200">
                <li>Isi data profil Anda (jenis kelamin, usia, berat, tinggi, dan level aktivitas)</li>
                <li>Pilih tujuan Anda (menurunkan, mempertahankan, atau menaikkan berat badan)</li>
                <li>Tambahkan makanan dan minuman yang Anda konsumsi hari ini</li>
                <li>Lihat ringkasan nutrisi dan sisa kalori yang tersedia</li>
                <li>Sesuaikan asupan makanan untuk mencapai tujuan Anda</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Profile */}
          <div className="space-y-6">
            {/* User Profile */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profil Anda
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jenis Kelamin
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        checked={userProfile.gender === 'male'}
                        onChange={() => setUserProfile(prev => ({ ...prev, gender: 'male' }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Pria</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        checked={userProfile.gender === 'female'}
                        onChange={() => setUserProfile(prev => ({ ...prev, gender: 'female' }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Wanita</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Usia
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="100"
                      value={userProfile.age}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Berat (kg)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="200"
                      value={userProfile.weight}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tinggi (cm)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={userProfile.height}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level Aktivitas
                  </label>
                  <select
                    value={userProfile.activityLevel}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, activityLevel: e.target.value as any }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="sedentary">Tidak Aktif (Jarang Olahraga)</option>
                    <option value="light">Sedikit Aktif (1-3 hari/minggu)</option>
                    <option value="moderate">Cukup Aktif (3-5 hari/minggu)</option>
                    <option value="active">Sangat Aktif (6-7 hari/minggu)</option>
                    <option value="very-active">Ekstra Aktif (Atlet/Pekerja Fisik)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tujuan
                  </label>
                  <select
                    value={userProfile.goal}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, goal: e.target.value as any }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="lose">Menurunkan Berat Badan</option>
                    <option value="maintain">Mempertahankan Berat Badan</option>
                    <option value="gain">Menaikkan Berat Badan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nutrition Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ringkasan Nutrisi
              </h3>
              
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Kalori</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{nutritionSummary.calorieGoal} kkal</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kalori Dikonsumsi</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{nutritionSummary.totalCalories} kkal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sisa Kalori</span>
                    <span className={`text-lg font-bold ${
                      nutritionSummary.caloriesRemaining >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {nutritionSummary.caloriesRemaining} kkal
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Makronutrien
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Protein ({nutritionSummary.proteinGoalPercentage}%)</span>
                        <span>{formatNumber(nutritionSummary.totalProtein)}g</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (nutritionSummary.totalProtein / (nutritionSummary.calorieGoal * nutritionSummary.proteinGoalPercentage / 100 / 4)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Karbohidrat ({nutritionSummary.carbsGoalPercentage}%)</span>
                        <span>{formatNumber(nutritionSummary.totalCarbs)}g</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (nutritionSummary.totalCarbs / (nutritionSummary.calorieGoal * nutritionSummary.carbsGoalPercentage / 100 / 4)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Lemak ({nutritionSummary.fatGoalPercentage}%)</span>
                        <span>{formatNumber(nutritionSummary.totalFat)}g</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (nutritionSummary.totalFat / (nutritionSummary.calorieGoal * nutritionSummary.fatGoalPercentage / 100 / 9)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>BMR:</strong> {Math.round(calculateBMR())} kkal/hari<br />
                    <strong>TDEE:</strong> {calculateTDEE()} kkal/hari<br />
                    <strong>Tujuan:</strong> {getGoalLabel(userProfile.goal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center & Right Columns - Food Tracking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Food */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tambah Makanan & Minuman
              </h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari makanan atau minuman..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                
                {showSearchResults && searchResults.length > 0 && (
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(food => (
                      <div 
                        key={food.id}
                        className="p-3 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                        onClick={() => addFoodToConsumed(food)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{food.calories} kkal</div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            P: {food.protein}g | K: {food.carbs}g | L: {food.fat}g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showSearchResults && searchTerm && searchResults.length === 0 && (
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Makanan tidak ditemukan</p>
                    <button
                      onClick={() => {
                        setShowAddCustomFood(true);
                        setShowSearchResults(false);
                        setCustomFood(prev => ({ ...prev, name: searchTerm }));
                      }}
                      className="mt-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                    >
                      + Tambah makanan kustom
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setShowAddCustomFood(true);
                      setShowSearchResults(false);
                    }}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium"
                  >
                    + Tambah makanan kustom
                  </button>
                  
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setShowSearchResults(false);
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
              
              {/* Add Custom Food Form */}
              {showAddCustomFood && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tambah Makanan Kustom
                  </h4>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nama makanan"
                      value={customFood.name}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Kalori (kkal)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={customFood.calories || ''}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, calories: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Jumlah
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={customFood.quantity || ''}
                            onChange={(e) => setCustomFood(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                            className="w-2/3 p-2 border border-gray-300 dark:border-gray-600 rounded-l bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <select
                            value={customFood.unit}
                            onChange={(e) => setCustomFood(prev => ({ ...prev, unit: e.target.value }))}
                            className="w-1/3 p-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="porsi">porsi</option>
                            <option value="gram">gram</option>
                            <option value="ml">ml</option>
                            <option value="buah">buah</option>
                            <option value="potong">potong</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={customFood.protein || ''}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Karbohidrat (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={customFood.carbs || ''}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Lemak (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={customFood.fat || ''}
                          onChange={(e) => setCustomFood(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => setShowAddCustomFood(false)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
                      >
                        Batal
                      </button>
                      <button
                        onClick={addCustomFood}
                        className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors duration-200"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Consumed Foods */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Makanan & Minuman Hari Ini
              </h3>
              
              {consumedFoods.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Belum ada makanan yang ditambahkan hari ini
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Cari dan tambahkan makanan di atas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consumedFoods.map(food => (
                    <div key={food.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {food.calories * food.quantity} kkal | P: {formatNumber(food.protein * food.quantity)}g | 
                          K: {formatNumber(food.carbs * food.quantity)}g | L: {formatNumber(food.fat * food.quantity)}g
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <button
                            onClick={() => updateFoodQuantity(food.id, Math.max(0.1, food.quantity - 0.1))}
                            className="p-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-l"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={food.quantity}
                            onChange={(e) => updateFoodQuantity(food.id, parseFloat(e.target.value) || 0)}
                            className="w-12 p-1 text-center border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={() => updateFoodQuantity(food.id, food.quantity + 0.1)}
                            className="p-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-r"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{food.unit}</span>
                        <button
                          onClick={() => removeFood(food.id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meal Suggestions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Rekomendasi Makanan
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Berdasarkan Target Kalori Anda
                  </h4>
                  
                  {nutritionSummary.caloriesRemaining > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Anda masih memiliki {nutritionSummary.caloriesRemaining} kkal tersisa. Berikut beberapa pilihan makanan:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {foodDatabase
                          .filter(food => food.calories <= nutritionSummary.caloriesRemaining)
                          .sort(() => 0.5 - Math.random())
                          .slice(0, 4)
                          .map(food => (
                            <div 
                              key={food.id}
                              className="p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500"
                              onClick={() => addFoodToConsumed(food)}
                            >
                              <div className="font-medium text-gray-900 dark:text-white text-sm">{food.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{food.calories} kkal</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Anda telah mencapai atau melebihi target kalori harian. Pertimbangkan untuk tidak menambah makanan lagi hari ini.
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Berdasarkan Kebutuhan Nutrisi
                  </h4>
                  
                  <div className="space-y-2">
                    {nutritionSummary.totalProtein < (nutritionSummary.calorieGoal * nutritionSummary.proteinGoalPercentage / 100 / 4) && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Anda perlu lebih banyak protein. Coba makanan berikut:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {foodDatabase
                            .filter(food => food.protein > 5)
                            .sort((a, b) => b.protein - a.protein)
                            .slice(0, 3)
                            .map(food => (
                              <div 
                                key={food.id}
                                className="p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500 text-xs"
                                onClick={() => addFoodToConsumed(food)}
                              >
                                {food.name} ({food.protein}g protein)
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {nutritionSummary.totalCarbs < (nutritionSummary.calorieGoal * nutritionSummary.carbsGoalPercentage / 100 / 4) && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Anda perlu lebih banyak karbohidrat. Coba makanan berikut:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {foodDatabase
                            .filter(food => food.carbs > 15)
                            .sort((a, b) => b.carbs - a.carbs)
                            .slice(0, 3)
                            .map(food => (
                              <div 
                                key={food.id}
                                className="p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500 text-xs"
                                onClick={() => addFoodToConsumed(food)}
                              >
                                {food.name} ({food.carbs}g karbo)
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🍽️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Database Makanan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ribuan makanan dengan informasi nutrisi lengkap
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analisis Nutrisi</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lacak kalori, protein, karbohidrat, dan lemak
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Target Kustom</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sesuaikan target kalori berdasarkan tujuan Anda
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">💡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rekomendasi</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Saran makanan berdasarkan kebutuhan nutrisi Anda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieCalculator;