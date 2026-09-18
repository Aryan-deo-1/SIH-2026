import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, Save, Sparkles, Heart } from 'lucide-react';

export const Preferences: React.FC = () => {
  const [dietType, setDietType] = useState('General');
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>(['Palm Oil']);
  const [maxSugar, setMaxSugar] = useState(10);
  const [maxSodium, setMaxSodium] = useState(600);
  const [minProtein, setMinProtein] = useState(10);
  const [budget, setBudget] = useState(300);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedPrefs = localStorage.getItem('packcheck_preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.dietType) setDietType(parsed.dietType);
        if (parsed.avoidIngredients) setAvoidIngredients(parsed.avoidIngredients);
        if (parsed.maxSugar) setMaxSugar(parsed.maxSugar);
        if (parsed.maxSodium) setMaxSodium(parsed.maxSodium);
        if (parsed.minProtein) setMinProtein(parsed.minProtein);
        if (parsed.budget) setBudget(parsed.budget);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSave = () => {
    const obj = {
      dietType,
      avoidIngredients,
      maxSugar,
      maxSodium,
      minProtein,
      budget
    };
    localStorage.setItem('packcheck_preferences', JSON.stringify(obj));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const dietOptions = ['General', 'Vegetarian', 'Vegan', 'Keto', 'Diabetic-Friendly'];
  const commonAvoid = ['Palm Oil', 'Peanuts', 'Gluten', 'Refined Sugar', 'Soy', 'Dairy', 'Preservatives'];

  const toggleAvoid = (item: string) => {
    setAvoidIngredients((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="text-center max-w-md mx-auto space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-brand-soft-orange text-brand-primary-orange flex items-center justify-center mx-auto">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
          User Preferences
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary-text">
          Personalize your dietary targets so PackCheck can tailor quality scores, warnings, and alternative recommendations.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-soft space-y-6">
        {/* Diet Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-brand-dark-text block">Dietary Profile</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {dietOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDietType(opt)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  dietType === opt
                    ? 'bg-brand-primary-orange text-white shadow-xs'
                    : 'bg-[#FAF6F0] border border-brand-border text-brand-secondary-text hover:bg-brand-soft-orange'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Avoid Ingredients */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-brand-dark-text block">Avoid / Allergen Exclusions</label>
          <div className="flex flex-wrap gap-2">
            {commonAvoid.map((item) => {
              const active = avoidIngredients.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAvoid(item)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                    active
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-white border-brand-border text-brand-secondary-text hover:bg-brand-soft-orange'
                  }`}
                >
                  {active ? `✕ ${item}` : `+ ${item}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Max Added Sugar Limit</span>
              <span className="font-mono text-amber-700 font-extrabold">{maxSugar}g / 100g</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              value={maxSugar}
              onChange={(e) => setMaxSugar(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Max Sodium Limit</span>
              <span className="font-mono text-rose-700 font-extrabold">{maxSodium}mg / 100g</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={maxSodium}
              onChange={(e) => setMaxSodium(parseFloat(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Min Target Protein</span>
              <span className="font-mono text-emerald-700 font-extrabold">{minProtein}g / 100g</span>
            </div>
            <input
              type="range"
              min="2"
              max="35"
              value={minProtein}
              onChange={(e) => setMinProtein(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Snack Budget Target</span>
              <span className="font-mono text-brand-dark-text font-extrabold">₹{budget}</span>
            </div>
            <input
              type="range"
              min="20"
              max="800"
              step="20"
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
              className="w-full accent-brand-primary-orange"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="pt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-brand-primary-orange hover:bg-brand-hover-orange text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-soft transition-all active:scale-95"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Preferences Saved!' : 'Save Dietary Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
