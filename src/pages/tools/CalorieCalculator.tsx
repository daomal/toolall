import React, { useState, useEffect } from 'react';
import { ArrowLeft, Utensils, Calculator, Activity, Info, RefreshCw, Plus, Trash2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CalorieResult {
  bmr: number;
  tdee: number;
  adjustedCalories: number;
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  weightGoal: {
    currentWeight: number;
    targetWeight: number | null;
    timeToReach: number | null;
    deficitPerDay: number | null;
  };
}

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

const foodDatabase: FoodItem[] = [
  { id: '1', name: 'Nasi Putih', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, quantity: 100, unit: 'gram' },
  { id: '2', name: 'Ayam Dada (tanpa kulit)', calories: 165, protein: 31, carbs: 0, fat: 3.6, quantity: 100, unit: 'gram' },
  { id: '3', name: 'Telur', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, quantity: 1, unit: 'butir' },
  { id: '4', name: 'Tempe', calories: 193, protein: 19, carbs: 9.4, fat: 11, quantity: 100, unit: 'gram' },
  { id: '5', name: 'Tahu', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, quantity: 100, unit: 'gram' },
  { id: '6', name: 'Pisang', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, quantity: 1, unit: 'buah' },
  { id: '7', name: 'Apel', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, quantity: 1, unit: 'buah' },
  { id: '8', name: 'Susu Full Cream', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, quantity: 100, unit: 'ml' },
  { id: '9', name: 'Roti Tawar', calories: 265, protein: 9, carbs: 49, fat: 3.2, quantity: 100, unit: 'gram' },
  { id: '10', name: 'Mie Instan', calories: 380, protein: 7, carbs: 54, fat: 14, quantity: 1, unit: 'bungkus' },
  { id: '11', name: 'Kentang', calories: 77, protein: 2, carbs: 17, fat: 0.1, quantity: 100, unit: 'gram' },
  { id: '12', name: 'Wortel', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, quantity: 100, unit: 'gram' },
  { id: '13', name: 'Brokoli', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, quantity: 100, unit: 'gram' },
  { id: '14', name: 'Kacang Tanah', calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2, quantity: 100, unit: 'gram' },
  { id: '15', name: 'Alpukat', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, quantity: 100, unit: 'gram' },
  { id: '16', name: 'Nasi Goreng', calories: 267, protein: 5.2, carbs: 42.1, fat: 8.7, quantity: 100, unit: 'gram' },
  { id: '17', name: 'Mie Goreng', calories: 321, protein: 7.8, carbs: 48.3, fat: 11.2, quantity: 100, unit: 'gram' },
  { id: '18', name: 'Sate Ayam', calories: 227, protein: 27.3, carbs: 1.2, fat: 13.2, quantity: 100, unit: 'gram' },
  { id: '19', name: 'Gado-gado', calories: 153, protein: 6.6, carbs: 11.2, fat: 9.1, quantity: 100, unit: 'gram' },
  { id: '20', name: 'Rendang', calories: 349, protein: 22.6, carbs: 7.8, fat: 25.3, quantity: 100, unit: 'gram' },
  { id: '21', name: 'Soto Ayam', calories: 103, protein: 8.3, carbs: 7.4, fat: 4.2, quantity: 100, unit: 'gram' },
  { id: '22', name: 'Bakso', calories: 218, protein: 14.5, carbs: 12.3, fat: 12.6, quantity: 100, unit: 'gram' },
  { id: '23', name: 'Martabak Manis', calories: 389, protein: 7.2, carbs: 52.1, fat: 17.3, quantity: 100, unit: 'gram' },
  { id: '24', name: 'Bubur Ayam', calories: 142, protein: 6.8, carbs: 22.5, fat: 2.9, quantity: 100, unit: 'gram' },
  { id: '25', name: 'Siomay', calories: 168, protein: 10.2, carbs: 18.7, fat: 6.3, quantity: 100, unit: 'gram' },
  { id: '26', name: 'Batagor', calories: 215, protein: 12.7, carbs: 16.8, fat: 11.2, quantity: 100, unit: 'gram' },
  { id: '27', name: 'Ketoprak', calories: 157, protein: 8.3, carbs: 19.6, fat: 5.7, quantity: 100, unit: 'gram' },
  { id: '28', name: 'Lontong Sayur', calories: 133, protein: 3.6, carbs: 23.5, fat: 3.2, quantity: 100, unit: 'gram' },
  { id: '29', name: 'Nasi Uduk', calories: 185, protein: 3.2, carbs: 32.7, fat: 4.8, quantity: 100, unit: 'gram' },
  { id: '30', name: 'Soto Betawi', calories: 211, protein: 10.3, carbs: 8.7, fat: 15.6, quantity: 100, unit: 'gram' }
];

const CalorieCalculator: React.FC = () => {
  // Form state
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [targetWeight, setTargetWeight] = useState<number | ''>('');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [goal, setGoal] = useState<string>('maintain');
  
  // Result state
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Food tracking state
  const [consumedFoods, setConsumedFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [customFood, setCustomFood] = useState<Omit<FoodItem, 'id'>>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    quantity: 1,
    unit: 'gram'
  });
  const [showAddCustomFood, setShowAddCustomFood] = useState<boolean>(false);
  const [totalConsumedCalories, setTotalConsumedCalories] = useState<number>(0);
  const [remainingCalories, setRemainingCalories] = useState<number>(0);
  const [consumedMacros, setConsumedMacros] = useState<{protein: number, carbs: number, fat: number}>({
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    veryActive: 1.9      // Very hard exercise & physical job
  };

  // Goal adjustments (in percentage)
  const goalAdjustments = {
    lose: -20,           // Lose weight (20% deficit)
    maintain: 0,         // Maintain weight
    gain: 15,            // Gain weight (15% surplus)
    muscle: 20           // Build muscle (20% surplus)
  };

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = (gender: string, weight: number, height: number, age: number): number => {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  // Calculate calories
  const calculateCalories = () => {
    // Validate inputs
    if (age === '' || height === '' || weight === '') {
      setError('Mohon lengkapi usia, tinggi, dan berat badan Anda.');
      return;
    }

    if (typeof age !== 'number' || typeof height !== 'number' || typeof weight !== 'number' || 
        age <= 0 || height <= 0 || weight <= 0) {
      setError('Nilai usia, tinggi, dan berat badan harus lebih dari 0.');
      return;
    }

    setError(null);

    // Calculate BMR
    const bmr = calculateBMR(gender, weight, height, age);
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    const activityMultiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || activityMultipliers.moderate;
    const tdee = bmr * activityMultiplier;
    
    // Adjust calories based on goal
    const goalAdjustment = goalAdjustments[goal as keyof typeof goalAdjustments] || goalAdjustments.maintain;
    const adjustedCalories = (tdee * goalAdjustment) / 100;
    const totalCalories = tdee + adjustedCalories;
    
    // Calculate macros (protein, carbs, fat)
    // Protein: 20% of calories (4 calories per gram)
    // Carbs: 50% of calories (4 calories per gram)
    // Fat: 30% of calories (9 calories per gram)
    const protein = (totalCalories * 0.2) / 4;
    const carbs = (totalCalories * 0.5) / 4;
    const fat = (totalCalories * 0.3) / 9;
    
    // Calculate weight goal timeline
    let timeToReach = null;
    let deficitPerDay = null;
    
    if (targetWeight !== '' && typeof targetWeight === 'number' && targetWeight > 0) {
      const weightDifference = weight - targetWeight;
      
      if (weightDifference !== 0) {
        // If losing weight (goal is "lose" and target < current)
        if (goal === 'lose' && targetWeight < weight) {
          // Assuming 1kg of fat = 7700 calories
          // Daily deficit = adjusted calories (negative)
          deficitPerDay = Math.abs(adjustedCalories);
          // Time to reach = (weight difference * 7700) / daily deficit
          timeToReach = (weightDifference * 7700) / deficitPerDay / 7; // in weeks
        }
        // If gaining weight (goal is "gain"/"muscle" and target > current)
        else if ((goal === 'gain' || goal === 'muscle') && targetWeight > weight) {
          // Assuming 1kg of weight gain = 7700 calories
          // Daily surplus = adjusted calories (positive)
          deficitPerDay = adjustedCalories;
          // Time to reach = (weight difference * 7700) / daily surplus
          timeToReach = (Math.abs(weightDifference) * 7700) / deficitPerDay / 7; // in weeks
        }
      }
    }
    
    // Set result
    const calculatedResult = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedCalories: Math.round(adjustedCalories),
      totalCalories: Math.round(totalCalories),
      macros: {
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat)
      },
      weightGoal: {
        currentWeight: weight,
        targetWeight: targetWeight !== '' ? targetWeight : null,
        timeToReach,
        deficitPerDay
      }
    };
    
    setResult(calculatedResult);
    setShowResult(true);
    
    // Update remaining calories
    setRemainingCalories(calculatedResult.totalCalories - totalConsumedCalories);
  };

  // Reset form
  const resetForm = () => {
    setGender('male');
    setAge('');
    setHeight('');
    setWeight('');
    setTargetWeight('');
    setActivityLevel('moderate');
    setGoal('maintain');
    setResult(null);
    setShowResult(false);
    setError(null);
    setConsumedFoods([]);
    setTotalConsumedCalories(0);
    setRemainingCalories(0);
    setConsumedMacros({protein: 0, carbs: 0, fat: 0});
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('id-ID');
  };
  
  // Search food database
  const searchFoods = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const results = foodDatabase.filter(food => 
      food.name.toLowerCase().includes(term.toLowerCase())
    );
    
    setSearchResults(results);
    setShowSearchResults(true);
  };
  
  // Add food to consumed list
  const addFood = (food: FoodItem) => {
    const newFood = { ...food, id: Date.now().toString() };
    setConsumedFoods(prev => [...prev, newFood]);
    setShowSearchResults(false);
    setSearchTerm('');
  };
  
  // Add custom food
  const addCustomFood = () => {
    if (!customFood.name || customFood.calories <= 0) {
      alert('Mohon isi nama makanan dan kalori dengan benar');
      return;
    }
    
    const newFood: FoodItem = {
      ...customFood,
      id: Date.now().toString()
    };
    
    setConsumedFoods(prev => [...prev, newFood]);
    setShowAddCustomFood(false);
    setCustomFood({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      quantity: 1,
      unit: 'gram'
    });
  };
  
  // Remove food from consumed list
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
  
  // Calculate total consumed calories and macros
  useEffect(() => {
    const totalCalories = consumedFoods.reduce((sum, food) => sum + (food.calories * food.quantity), 0);
    const totalProtein = consumedFoods.reduce((sum, food) => sum + (food.protein * food.quantity), 0);
    const totalCarbs = consumedFoods.reduce((sum, food) => sum + (food.carbs * food.quantity), 0);
    const totalFat = consumedFoods.reduce((sum, food) => sum + (food.fat * food.quantity), 0);
    
    setTotalConsumedCalories(totalCalories);
    setConsumedMacros({
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    });
    
    if (result) {
      setRemainingCalories(result.totalCalories - totalCalories);
    }
  }, [consumedFoods, result]);
  
  // Update search results when search term changes
  useEffect(() => {
    searchFoods(searchTerm);
  }, [searchTerm]);

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Kalkulator Kalori
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hitung kebutuhan kalori harian dan lacak asupan makanan Anda.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Disclaimer Medis
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200">
                Kalkulator ini memberikan estimasi kebutuhan kalori berdasarkan rumus standar. Hasil perhitungan bersifat perkiraan dan tidak menggantikan saran dari profesional kesehatan. Konsultasikan dengan dokter atau ahli gizi untuk rekomendasi diet yang disesuaikan dengan kondisi kesehatan Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informasi Pribadi
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
            
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
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Pria</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600"
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
                    value={age}
                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Tahun"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tinggi Badan
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="cm"
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Berat Badan
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="kg"
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Berat Target (Opsional)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="kg"
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tingkat Aktivitas
                </label>
                <select 
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="sedentary">Sangat Rendah (Jarang Berolahraga)</option>
                  <option value="light">Rendah (Olahraga Ringan 1-3 hari/minggu)</option>
                  <option value="moderate">Sedang (Olahraga Moderat 3-5 hari/minggu)</option>
                  <option value="active">Tinggi (Olahraga Berat 6-7 hari/minggu)</option>
                  <option value="veryActive">Sangat Tinggi (Atlet/Pekerjaan Fisik Berat)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tujuan
                </label>
                <select 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="lose">Menurunkan Berat Badan</option>
                  <option value="maintain">Mempertahankan Berat Badan</option>
                  <option value="gain">Menambah Berat Badan</option>
                  <option value="muscle">Membangun Otot</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={calculateCalories}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Hitung Kebutuhan Kalori</span>
                </button>
                
                <button 
                  onClick={resetForm}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {showResult && result && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Hasil Perhitungan
                  </h3>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-red-700 dark:text-red-300 mb-1">
                        Kebutuhan Kalori Harian
                      </div>
                      <div className="text-3xl font-bold text-red-800 dark:text-red-200">
                        {formatNumber(result.totalCalories)}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                        kalori per hari
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">BMR (Basal Metabolic Rate)</span>
                          <span className="text-gray-900 dark:text-white font-medium">{formatNumber(result.bmr)} kalori</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">TDEE (Total Daily Energy Expenditure)</span>
                          <span className="text-gray-900 dark:text-white font-medium">{formatNumber(result.tdee)} kalori</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Penyesuaian untuk Tujuan</span>
                          <span className={`font-medium ${result.adjustedCalories >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.adjustedCalories >= 0 ? '+' : ''}{formatNumber(result.adjustedCalories)} kalori
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Distribusi Makronutrien yang Direkomendasikan
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                          <div className="text-sm text-blue-700 dark:text-blue-300">Protein</div>
                          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{result.macros.protein}g</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">20%</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                          <div className="text-sm text-green-700 dark:text-green-300">Karbohidrat</div>
                          <div className="text-lg font-bold text-green-800 dark:text-green-200">{result.macros.carbs}g</div>
                          <div className="text-xs text-green-600 dark:text-green-400">50%</div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
                          <div className="text-sm text-yellow-700 dark:text-yellow-300">Lemak</div>
                          <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200">{result.macros.fat}g</div>
                          <div className="text-xs text-yellow-600 dark:text-yellow-400">30%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weight Goal - Only show if target weight is provided */}
                {result.weightGoal.targetWeight && result.weightGoal.timeToReach && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Proyeksi Berat Badan
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Berat Saat Ini</div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">{result.weightGoal.currentWeight} kg</div>
                        </div>
                        <div className="text-2xl text-gray-300 dark:text-gray-600">→</div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Berat Target</div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">{result.weightGoal.targetWeight} kg</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimasi Waktu</span>
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            {Math.ceil(result.weightGoal.timeToReach)} minggu
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Berdasarkan {result.weightGoal.deficitPerDay ? Math.abs(Math.round(result.weightGoal.deficitPerDay)) : 0} kalori {result.adjustedCalories < 0 ? 'defisit' : 'surplus'}/hari ({Math.abs(result.weightGoal.currentWeight - result.weightGoal.targetWeight) / Math.ceil(result.weightGoal.timeToReach)} kg/minggu)
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-start space-x-2">
                          <Activity className="w-4 h-4 mt-0.5 text-gray-500" />
                          <p>
                            {result.adjustedCalories < 0 
                              ? 'Penurunan berat badan yang sehat dan berkelanjutan adalah 0.5-1 kg per minggu. Penurunan yang lebih cepat dapat menyebabkan kehilangan massa otot dan efek yo-yo.'
                              : 'Penambahan berat badan yang sehat adalah 0.25-0.5 kg per minggu untuk memaksimalkan penambahan massa otot dan meminimalkan penambahan lemak.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Food Tracking */}
            {showResult && result && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pelacakan Makanan
                </h3>
                
                <div className="space-y-4">
                  {/* Calories Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-sm text-green-700 dark:text-green-300 mb-1">Target Kalori</div>
                      <div className="text-xl font-bold text-green-800 dark:text-green-200">{formatNumber(result.totalCalories)}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Sisa Kalori</div>
                      <div className="text-xl font-bold text-blue-800 dark:text-blue-200">{formatNumber(remainingCalories)}</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Konsumsi: {formatNumber(totalConsumedCalories)} kalori</span>
                      <span className="text-gray-600 dark:text-gray-400">{Math.round((totalConsumedCalories / result.totalCalories) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          totalConsumedCalories > result.totalCalories 
                            ? 'bg-red-600' 
                            : totalConsumedCalories > result.totalCalories * 0.8 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((totalConsumedCalories / result.totalCalories) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Macros Consumed */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Protein</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(consumedMacros.protein)}g</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.macros.protein > 0 ? Math.round((consumedMacros.protein / result.macros.protein) * 100) : 0}%
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Karbohidrat</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(consumedMacros.carbs)}g</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.macros.carbs > 0 ? Math.round((consumedMacros.carbs / result.macros.carbs) * 100) : 0}%
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Lemak</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(consumedMacros.fat)}g</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.macros.fat > 0 ? Math.round((consumedMacros.fat / result.macros.fat) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Food */}
                  <div className="relative">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Cari makanan..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onFocus={() => setShowSearchResults(true)}
                          className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddCustomFood(true)}
                        className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Search Results */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
                        {searchResults.map(food => (
                          <div 
                            key={food.id}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            onClick={() => addFood(food)}
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {food.calories} kal | P: {food.protein}g | K: {food.carbs}g | L: {food.fat}g
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Per {food.quantity} {food.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No Results */}
                    {showSearchResults && searchTerm && searchResults.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Tidak ditemukan. <button onClick={() => setShowAddCustomFood(true)} className="text-red-600 dark:text-red-400 hover:underline">Tambah makanan kustom</button>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Custom Food Form */}
                  {showAddCustomFood && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Tambah Makanan Kustom</h4>
                        <button onClick={() => setShowAddCustomFood(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
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
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Kalori</label>
                            <input
                              type="number"
                              placeholder="Kalori"
                              value={customFood.calories || ''}
                              onChange={(e) => setCustomFood(prev => ({ ...prev, calories: parseFloat(e.target.value) || 0 }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Protein (g)</label>
                            <input
                              type="number"
                              placeholder="Protein"
                              value={customFood.protein || ''}
                              onChange={(e) => setCustomFood(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Karbohidrat (g)</label>
                            <input
                              type="number"
                              placeholder="Karbohidrat"
                              value={customFood.carbs || ''}
                              onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Lemak (g)</label>
                            <input
                              type="number"
                              placeholder="Lemak"
                              value={customFood.fat || ''}
                              onChange={(e) => setCustomFood(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Jumlah</label>
                            <input
                              type="number"
                              placeholder="Jumlah"
                              value={customFood.quantity || ''}
                              onChange={(e) => setCustomFood(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Satuan</label>
                            <select
                              value={customFood.unit}
                              onChange={(e) => setCustomFood(prev => ({ ...prev, unit: e.target.value }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="gram">gram</option>
                              <option value="ml">ml</option>
                              <option value="buah">buah</option>
                              <option value="porsi">porsi</option>
                              <option value="sendok makan">sendok makan</option>
                              <option value="sendok teh">sendok teh</option>
                            </select>
                          </div>
                        </div>
                        
                        <button
                          onClick={addCustomFood}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium"
                        >
                          Tambah Makanan
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Consumed Foods List */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Makanan yang Dikonsumsi
                    </h4>
                    
                    {consumedFoods.length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">
                          Belum ada makanan yang ditambahkan
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {consumedFoods.map(food => (
                          <div key={food.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {food.calories * food.quantity} kal | P: {Math.round(food.protein * food.quantity)}g | K: {Math.round(food.carbs * food.quantity)}g | L: {Math.round(food.fat * food.quantity)}g
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0.25"
                                step="0.25"
                                value={food.quantity}
                                onChange={(e) => updateFoodQuantity(food.id, parseFloat(e.target.value) || 1)}
                                className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                              />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{food.unit}</span>
                              <button
                                onClick={() => removeFood(food.id)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Nutrition Tips */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
                Tips Nutrisi
              </h3>
              
              <div className="space-y-3 text-red-800 dark:text-red-200">
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Fokus pada makanan bergizi padat seperti buah-buahan, sayuran, protein tanpa lemak, dan biji-bijian utuh.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Minum cukup air (minimal 8 gelas per hari) untuk mendukung metabolisme dan fungsi tubuh.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Batasi makanan olahan, gula tambahan, dan minuman berkalori tinggi.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Perubahan pola makan yang berkelanjutan lebih efektif daripada diet ketat jangka pendek.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🔬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Akurat</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Menggunakan rumus Mifflin-St Jeor yang diakui secara ilmiah
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">🥗</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pelacak Makanan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Lacak asupan kalori dan makronutrien harian Anda
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">⚖️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi Tujuan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Penurunan, pemeliharaan, atau penambahan berat badan
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Proyeksi</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Estimasi waktu untuk mencapai berat badan target
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieCalculator;