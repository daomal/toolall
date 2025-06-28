import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';

// Import all tool pages
import PDFMerger from './pages/tools/PDFMerger';
import PDFSplitter from './pages/tools/PDFSplitter';
import PDFReorder from './pages/tools/PDFReorder';
import JPGToPDF from './pages/tools/JPGToPDF';
import PDFSignature from './pages/tools/PDFSignature';
import PDFWatermark from './pages/tools/PDFWatermark';
import TextToPDF from './pages/tools/TextToPDF';
import InvoiceGenerator from './pages/tools/InvoiceGenerator';
import CVBuilder from './pages/tools/CVBuilder';
import ImageConverter from './pages/tools/ImageConverter';
import ImageCompressor from './pages/tools/ImageCompressor';
import UnitConverter from './pages/tools/UnitConverter';
import ColorPaletteGenerator from './pages/tools/ColorPaletteGenerator';
import TextCounter from './pages/tools/TextCounter';
import PomodoroTimer from './pages/tools/PomodoroTimer';
import FlashcardMaker from './pages/tools/FlashcardMaker';
import ProfitCalculator from './pages/tools/ProfitCalculator';
import QRCodeGenerator from './pages/tools/QRCodeGenerator';
import EmailSignatureGenerator from './pages/tools/EmailSignatureGenerator';

// Import new tool pages
import PDFOrganizer from './pages/tools/PDFOrganizer';
import PDFPageNumbers from './pages/tools/PDFPageNumbers';
import PDFProtect from './pages/tools/PDFProtect';
import PDFToJPG from './pages/tools/PDFToJPG';
import CitationGenerator from './pages/tools/CitationGenerator';
import SocialMediaResizer from './pages/tools/SocialMediaResizer';
import FinancialCalculators from './pages/tools/FinancialCalculators';
import UnitPriceCalculator from './pages/tools/UnitPriceCalculator';
import BillSplitter from './pages/tools/BillSplitter';
import LoanCalculator from './pages/tools/LoanCalculator';
import ZakatCalculator from './pages/tools/ZakatCalculator';
import TaxCalculator from './pages/tools/TaxCalculator';

// Import new productivity & planning tools
import ItineraryPlanner from './pages/tools/ItineraryPlanner';
import MeetingNotesGenerator from './pages/tools/MeetingNotesGenerator';
import DateCalculator from './pages/tools/DateCalculator';
import WorldTimeCalculator from './pages/tools/WorldTimeCalculator';
import StudyPlanner from './pages/tools/StudyPlanner';
import RandomPickerWheel from './pages/tools/RandomPickerWheel';

// Import developer & SEO tools
import MetaTagGenerator from './pages/tools/MetaTagGenerator';

// Import security & privacy tools
import SecureNote from './pages/tools/SecureNote';

// Import health & lifestyle tools
import BMICalculator from './pages/tools/BMICalculator';
import CalorieCalculator from './pages/tools/CalorieCalculator';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Dokumen & PDF Tools */}
            <Route path="/pdf-merger" element={<PDFMerger />} />
            <Route path="/pdf-reorder" element={<PDFReorder />} />
            <Route path="/jpg-to-pdf" element={<JPGToPDF />} />
            <Route path="/pdf-signature" element={<PDFSignature />} />
            <Route path="/pdf-watermark" element={<PDFWatermark />} />
            <Route path="/text-to-pdf" element={<TextToPDF />} />
            <Route path="/invoice-generator" element={<InvoiceGenerator />} />
            <Route path="/cv-builder" element={<CVBuilder />} />
            <Route path="/pdf-organizer" element={<PDFOrganizer />} />
            <Route path="/pdf-page-numbers" element={<PDFPageNumbers />} />
            <Route path="/pdf-protect" element={<PDFProtect />} />
            <Route path="/pdf-to-jpg" element={<PDFToJPG />} />
            <Route path="/citation-generator" element={<CitationGenerator />} />
            
            {/* Gambar & Grafis Tools */}
            <Route path="/image-converter" element={<ImageConverter />} />
            <Route path="/konverter-unit" element={<UnitConverter />} />
            <Route path="/color-palette-generator" element={<ColorPaletteGenerator />} />
            <Route path="/social-media-resizer" element={<SocialMediaResizer />} />
            
            {/* Produktivitas Tools */}
            <Route path="/text-counter" element={<TextCounter />} />
            <Route path="/pomodoro-timer" element={<PomodoroTimer />} />
            <Route path="/flashcard-maker" element={<FlashcardMaker />} />
            <Route path="/profit-calculator" element={<ProfitCalculator />} />
            <Route path="/itinerary-planner" element={<ItineraryPlanner />} />
            <Route path="/meeting-notes-generator" element={<MeetingNotesGenerator />} />
            <Route path="/date-calculator" element={<DateCalculator />} />
            <Route path="/world-time-calculator" element={<WorldTimeCalculator />} />
            <Route path="/study-planner" element={<StudyPlanner />} />
            <Route path="/random-picker-wheel" element={<RandomPickerWheel />} />
            
            {/* Kalkulator & Keuangan Tools */}
            <Route path="/financial-calculators" element={<FinancialCalculators />} />
            <Route path="/unit-price-calculator" element={<UnitPriceCalculator />} />
            <Route path="/bill-splitter" element={<BillSplitter />} />
            <Route path="/loan-calculator" element={<LoanCalculator />} />
            <Route path="/zakat-calculator" element={<ZakatCalculator />} />
            <Route path="/tax-calculator" element={<TaxCalculator />} />
            
            {/* Developer & SEO Tools */}
            <Route path="/meta-tag-generator" element={<MetaTagGenerator />} />
            
            {/* Keamanan & Privasi Tools */}
            <Route path="/secure-note" element={<SecureNote />} />
            
            {/* Kesehatan & Gaya Hidup Tools */}
            <Route path="/bmi-calculator" element={<BMICalculator />} />
            <Route path="/calorie-calculator" element={<CalorieCalculator />} />
            
            {/* Web & Pemasaran Tools */}
            <Route path="/qr-code-generator" element={<QRCodeGenerator />} />
            <Route path="/email-signature-generator" element={<EmailSignatureGenerator />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;