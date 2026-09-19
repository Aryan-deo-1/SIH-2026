import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { Scanner } from './pages/Scanner';
import { Processing } from './pages/Processing';
import { ProductDashboard } from './pages/ProductDashboard';
import { Search } from './pages/Search';
import { DietFinder } from './pages/DietFinder';
import { Compare } from './pages/Compare';
import { History } from './pages/History';
import { Preferences } from './pages/Preferences';
import { Admin } from './pages/Admin';

import { AIProvider } from './context/AIContext';
import { PackCheckAI } from './components/PackCheckAI';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AIProvider>
        <div className="min-h-screen flex flex-col bg-[#FFFDFB]">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scan" element={<Scanner />} />
              <Route path="/processing" element={<Processing />} />
              <Route path="/product/:id" element={<ProductDashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/diet" element={<DietFinder />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/history" element={<History />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
          <PackCheckAI />
        </div>
      </AIProvider>
    </BrowserRouter>
  );
};

export default App;
