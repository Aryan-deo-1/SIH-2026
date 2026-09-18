export const SEED_RULES = [
  {
    id: 'rule-sugar-high',
    category: 'ALL',
    field: 'sugar',
    operator: 'GTE',
    threshold: 15.0,
    severity: 'HIGH',
    message: 'High total sugar content (> 15g per 100g). Exceeds recommended dietary threshold.',
    source: 'ICMR / FSSAI Dietary Guidelines'
  },
  {
    id: 'rule-added-sugar-high',
    category: 'ALL',
    field: 'addedSugar',
    operator: 'GTE',
    threshold: 10.0,
    severity: 'HIGH',
    message: 'High added sugar content (> 10g per 100g). Regular consumption may contribute to metabolic strain.',
    source: 'WHO / FSSAI Added Sugar Limits'
  },
  {
    id: 'rule-sodium-high',
    category: 'ALL',
    field: 'sodium',
    operator: 'GTE',
    threshold: 600.0,
    severity: 'HIGH',
    message: 'High sodium content (> 600mg per 100g). May exceed 25% of daily recommended allowance in one portion.',
    source: 'ICMR RDA Guidelines'
  },
  {
    id: 'rule-sat-fat-high',
    category: 'ALL',
    field: 'saturatedFat',
    operator: 'GTE',
    threshold: 5.0,
    severity: 'MEDIUM',
    message: 'High saturated fat (> 5g per 100g). Moderation advised for cardiovascular health.',
    source: 'FSSAI Packaging Regulations'
  },
  {
    id: 'rule-trans-fat-alert',
    category: 'ALL',
    field: 'transFat',
    operator: 'GTE',
    threshold: 0.2,
    severity: 'CRITICAL',
    message: 'Industrial trans fatty acids detected (> 0.2g per 100g). FSSAI limits require elimination of trans fats.',
    source: 'FSSAI Trans-Fat Free Mandate'
  },
  {
    id: 'rule-protein-high',
    category: 'ALL',
    field: 'protein',
    operator: 'GTE',
    threshold: 10.0,
    severity: 'POSITIVE',
    message: 'Rich source of dietary protein (> 10g per 100g). Supports muscle maintenance and satiety.',
    source: 'FSSAI High Protein Criteria'
  },
  {
    id: 'rule-fiber-high',
    category: 'ALL',
    field: 'fiber',
    operator: 'GTE',
    threshold: 5.0,
    severity: 'POSITIVE',
    message: 'High dietary fiber (> 5g per 100g). Promotes healthy digestion and gut microbiome.',
    source: 'ICMR Fiber Guidelines'
  },
  {
    id: 'rule-sugar-low',
    category: 'ALL',
    field: 'sugar',
    operator: 'LTE',
    threshold: 5.0,
    severity: 'POSITIVE',
    message: 'Low total sugar content (≤ 5g per 100g). Suitable for balanced diets.',
    source: 'FSSAI Low Sugar Criteria'
  }
];

export const SEED_PRODUCTS = [
  // 1. CHIPS
  {
    name: 'Lays Classic Salted Potato Chips',
    brand: 'Lays',
    category: 'Chips',
    manufacturer: 'PepsiCo India Holdings Pvt. Ltd.',
    barcodeGtIN: '8901491101837',
    packSize: '50g',
    price: 20,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 544,
      protein: 7.0,
      carbohydrates: 53.0,
      sugar: 1.0,
      addedSugar: 0.0,
      fat: 34.0,
      saturatedFat: 14.5,
      transFat: 0.1,
      fiber: 3.2,
      sodium: 590
    },
    ingredient: {
      ingredientText: 'Potato, Edible Vegetable Oil (Palmolein, Rice Bran Oil), Iodised Salt (1.5%).',
      allergens: []
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10014064000435',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Manufacturer license verified on FSSAI FoSCoS portal for PepsiCo India.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10014064000435', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Too Yumm! Karare Munchy Masala',
    brand: 'Too Yumm!',
    category: 'Chips',
    manufacturer: 'Guiltfree Industries Limited',
    barcodeGtIN: '8906090572118',
    packSize: '75g',
    price: 30,
    imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 478,
      protein: 6.5,
      carbohydrates: 68.0,
      sugar: 5.5,
      addedSugar: 2.0,
      fat: 20.0,
      saturatedFat: 7.8,
      transFat: 0.0,
      fiber: 4.8,
      sodium: 780
    },
    ingredient: {
      ingredientText: 'Rice Flour, Corn Flour, Edible Vegetable Oil (Sunflower), Seasoning (Spices & Condiments, Iodised Salt, Onion Powder, Garlic Powder, Citric Acid).',
      allergens: ['May contain Soy', 'Wheat']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10017031002079',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Active manufacturer license with Guiltfree Industries Ltd.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10017031002079', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Bingo! Mad Angles Achaari Masti',
    brand: 'Bingo!',
    category: 'Chips',
    manufacturer: 'ITC Limited',
    barcodeGtIN: '8901725181123',
    packSize: '66g',
    price: 20,
    imageUrl: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 520,
      protein: 6.0,
      carbohydrates: 59.0,
      sugar: 4.0,
      addedSugar: 1.5,
      fat: 29.0,
      saturatedFat: 13.0,
      transFat: 0.1,
      fiber: 3.0,
      sodium: 840
    },
    ingredient: {
      ingredientText: 'Rice Grits, Seasoning (Iodised Salt, Spices, Mango Powder), Edible Vegetable Oil (Palmolein), Corn Grits, Gram Grits.',
      allergens: ['Contains Wheat']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10012031000312',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'ITC Foods manufacturing unit registered on FoSCoS.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10012031000312', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 2. BISCUITS
  {
    name: 'Britannia NutriChoice Digestive High Fibre',
    brand: 'Britannia',
    category: 'Biscuits',
    manufacturer: 'Britannia Industries Ltd.',
    barcodeGtIN: '8901063013825',
    packSize: '100g',
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 475,
      protein: 8.5,
      carbohydrates: 68.0,
      sugar: 14.0,
      addedSugar: 12.0,
      fat: 19.0,
      saturatedFat: 8.5,
      transFat: 0.0,
      fiber: 6.0,
      sodium: 480
    },
    ingredient: {
      ingredientText: 'Refined Wheat Flour (Maida - 45%), Whole Wheat Flour (Atta - 20%), Edible Vegetable Oil (Palm), Sugar, Wheat Bran (4.5%), Invert Sugar Syrup, Raising Agents, Milk Solids, Iodised Salt.',
      allergens: ['Wheat', 'Milk']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10015043001129',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Britannia Industries central license verified.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10015043001129', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Britannia Good Day Cashew Cookies',
    brand: 'Britannia',
    category: 'Biscuits',
    manufacturer: 'Britannia Industries Ltd.',
    barcodeGtIN: '8901063014235',
    packSize: '120g',
    price: 30,
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 508,
      protein: 6.5,
      carbohydrates: 67.0,
      sugar: 23.0,
      addedSugar: 21.0,
      fat: 24.0,
      saturatedFat: 11.5,
      transFat: 0.1,
      fiber: 1.8,
      sodium: 320
    },
    ingredient: {
      ingredientText: 'Refined Wheat Flour (Maida), Sugar, Edible Vegetable Oil (Palm), Cashew Nuts (4.5%), Butter, Invert Sugar Syrup, Milk Solids, Raising Agents, Iodised Salt.',
      allergens: ['Wheat', 'Milk', 'Tree Nuts (Cashew)']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10015043001129',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Britannia central manufacturer license verified.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10015043001129', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Parle-G Original Gluco Biscuits',
    brand: 'Parle',
    category: 'Biscuits',
    manufacturer: 'Parle Products Pvt. Ltd.',
    barcodeGtIN: '8901719101014',
    packSize: '130g',
    price: 10,
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 454,
      protein: 6.7,
      carbohydrates: 78.2,
      sugar: 26.5,
      addedSugar: 24.0,
      fat: 12.8,
      saturatedFat: 5.8,
      transFat: 0.0,
      fiber: 2.1,
      sodium: 290
    },
    ingredient: {
      ingredientText: 'Wheat Flour (67%), Sugar, Edible Vegetable Oil (Palm Oil), Invert Sugar Syrup, Raising Agents, Milk Solids, Salt, Emulsifier.',
      allergens: ['Wheat', 'Milk']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10013022002253',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Parle Products Pvt Ltd active FSSAI registration.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10013022002253', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 3. PEANUT BUTTER
  {
    name: 'Pintola All Natural Peanut Butter Crunchy',
    brand: 'Pintola',
    category: 'Peanut Butter',
    manufacturer: 'Sopan Bhuva Foods LLP',
    barcodeGtIN: '8906079970119',
    packSize: '1000g',
    price: 425,
    imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 625,
      protein: 30.0,
      carbohydrates: 18.0,
      sugar: 3.0,
      addedSugar: 0.0,
      fat: 50.0,
      saturatedFat: 9.0,
      transFat: 0.0,
      fiber: 9.0,
      sodium: 15
    },
    ingredient: {
      ingredientText: '100% Roasted Peanuts. No Added Sugar. No Hydrogenated Oils. No Salt.',
      allergens: ['Peanuts']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10019021004124',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Sopan Bhuva Foods LLP active central license for nut processing.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10019021004124', status: 'Active', source: 'FSSAI' },
      { type: 'Non-GMO', identifier: 'NGMO-9812', status: 'Verified', source: 'Third Party' }
    ]
  },
  {
    name: 'MyFitness Chocolate Peanut Butter Crispy',
    brand: 'MyFitness',
    category: 'Peanut Butter',
    manufacturer: 'Tanvi Fitness Private Limited',
    barcodeGtIN: '8906105430519',
    packSize: '510g',
    price: 349,
    imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 590,
      protein: 26.0,
      carbohydrates: 25.0,
      sugar: 11.0,
      addedSugar: 8.0,
      fat: 44.0,
      saturatedFat: 10.0,
      transFat: 0.0,
      fiber: 6.5,
      sodium: 120
    },
    ingredient: {
      ingredientText: 'Roasted Peanuts (80%), Dark Chocolate, Brown Sugar, Rice Crisps, Cocoa Butter, Salt.',
      allergens: ['Peanuts']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10018021003719',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Manufacturer license verified under Tanvi Fitness.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10018021003719', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Sundrop Crunchy Peanut Butter Regular',
    brand: 'Sundrop',
    category: 'Peanut Butter',
    manufacturer: 'Agro Tech Foods Ltd.',
    barcodeGtIN: '8901512121028',
    packSize: '462g',
    price: 195,
    imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 610,
      protein: 24.0,
      carbohydrates: 22.0,
      sugar: 12.0,
      addedSugar: 10.0,
      fat: 48.0,
      saturatedFat: 11.0,
      transFat: 0.0,
      fiber: 5.0,
      sodium: 380
    },
    ingredient: {
      ingredientText: 'Roasted Peanuts (90%), Sugar, Hydrogenated Vegetable Oil (Soybean/Palm), Iodised Salt.',
      allergens: ['Peanuts', 'Soybean']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10012044000109',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Agro Tech Foods Ltd central license active.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10012044000109', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 4. CEREAL
  {
    name: "Kellogg's Corn Flakes Original",
    brand: "Kellogg's",
    category: 'Cereal',
    manufacturer: 'Kellogg India Pvt. Ltd.',
    barcodeGtIN: '8901499008015',
    packSize: '475g',
    price: 190,
    imageUrl: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 382,
      protein: 7.2,
      carbohydrates: 84.0,
      sugar: 8.5,
      addedSugar: 7.5,
      fat: 0.8,
      saturatedFat: 0.2,
      transFat: 0.0,
      fiber: 2.7,
      sodium: 710,
      iron: 12.0,
      vitaminC: 25.0
    },
    ingredient: {
      ingredientText: 'Milled Corn (91.4%), Sugar, Cereal Extract, Iodised Salt, Vitamins & Minerals (Vitamin C, Iron, Niacinamide, Vitamin B6, B2, B1, Folic Acid, Vitamin B12).',
      allergens: ['May contain Gluten']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10013022002031',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Kellogg India Pvt Ltd manufacturing certification active.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10013022002031', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Quaker Rolled Whole Grain Oats',
    brand: 'Quaker',
    category: 'Cereal',
    manufacturer: 'PepsiCo India Holdings Pvt. Ltd.',
    barcodeGtIN: '8901491500012',
    packSize: '1000g',
    price: 210,
    imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 407,
      protein: 11.8,
      carbohydrates: 68.5,
      sugar: 0.5,
      addedSugar: 0.0,
      fat: 9.5,
      saturatedFat: 1.8,
      transFat: 0.0,
      fiber: 10.2,
      sodium: 5,
      iron: 3.8
    },
    ingredient: {
      ingredientText: '100% Whole Grain Rolled Oats.',
      allergens: ['Oats', 'May contain traces of wheat']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10014064000435',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'PepsiCo India grain processing facility verified on FoSCoS.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10014064000435', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 5. MILK & DAIRY
  {
    name: 'Amul Taaza Homogenised Toned Milk',
    brand: 'Amul',
    category: 'Milk',
    manufacturer: 'GCMMF',
    barcodeGtIN: '8901262010052',
    packSize: '1000ml',
    price: 72,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 58,
      protein: 3.2,
      carbohydrates: 4.7,
      sugar: 4.7,
      addedSugar: 0.0,
      fat: 3.0,
      saturatedFat: 1.9,
      transFat: 0.0,
      fiber: 0.0,
      sodium: 50,
      calcium: 120
    },
    ingredient: {
      ingredientText: 'Toned Milk, Vitamin A & Vitamin D (Fortified).',
      allergens: ['Milk']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10012021000071',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'GCMMF central cooperative dairy license verified on FoSCoS.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10012021000071', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Epigamia Almond Milk Unsweetened',
    brand: 'Epigamia',
    category: 'Milk',
    manufacturer: 'Drums Food International Pvt. Ltd.',
    barcodeGtIN: '8906085521092',
    packSize: '1000ml',
    price: 240,
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 32,
      protein: 1.2,
      carbohydrates: 0.8,
      sugar: 0.2,
      addedSugar: 0.0,
      fat: 2.6,
      saturatedFat: 0.3,
      transFat: 0.0,
      fiber: 0.8,
      sodium: 42,
      calcium: 140
    },
    ingredient: {
      ingredientText: 'Water, Almonds (4.5%), Tricalcium Phosphate, Emulsifier (Sunflower Lecithin), Salt, Stabilizer (Gellan Gum), Vitamin D2.',
      allergens: ['Tree Nuts (Almond)']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10019022009874',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Drums Food plant verified under central food authority.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10019022009874', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 6. JUICE
  {
    name: 'Real Fruit Power Mixed Fruit Juice',
    brand: 'Real',
    category: 'Juice',
    manufacturer: 'Dabur India Limited',
    barcodeGtIN: '8901207010156',
    packSize: '1000ml',
    price: 130,
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 60,
      protein: 0.4,
      carbohydrates: 14.5,
      sugar: 14.0,
      addedSugar: 9.5,
      fat: 0.0,
      saturatedFat: 0.0,
      transFat: 0.0,
      fiber: 0.2,
      sodium: 25,
      vitaminC: 15.0
    },
    ingredient: {
      ingredientText: 'Water, Mixed Fruit Concentrate, Sugar, Acidity Regulator (Citric Acid), Antioxidant.',
      allergens: []
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10012011000618',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Dabur India central processing license verified.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10012011000618', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Raw Pressery Cold Pressed Valencia Orange Juice',
    brand: 'Raw Pressery',
    category: 'Juice',
    manufacturer: 'Rakyan Beverages Pvt. Ltd.',
    barcodeGtIN: '8906069002158',
    packSize: '250ml',
    price: 90,
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 45,
      protein: 0.7,
      carbohydrates: 10.5,
      sugar: 8.5,
      addedSugar: 0.0,
      fat: 0.1,
      saturatedFat: 0.0,
      transFat: 0.0,
      fiber: 0.6,
      sodium: 10,
      vitaminC: 38.0
    },
    ingredient: {
      ingredientText: '100% Valencia Orange Juice (Not from concentrate). No Added Water. No Added Sugar.',
      allergens: []
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10015022003889',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Rakyan cold press bottling facility licensed on FoSCoS.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10015022003889', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 7. INSTANT NOODLES
  {
    name: 'Maggi 2-Minute Masala Instant Noodles',
    brand: 'Maggi',
    category: 'Instant Noodles',
    manufacturer: 'Nestlé India Limited',
    barcodeGtIN: '8901058852309',
    packSize: '70g',
    price: 14,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 427,
      protein: 8.0,
      carbohydrates: 63.5,
      sugar: 2.2,
      addedSugar: 1.0,
      fat: 15.7,
      saturatedFat: 6.8,
      transFat: 0.1,
      fiber: 3.6,
      sodium: 1020
    },
    ingredient: {
      ingredientText: 'Noodles: Refined wheat flour, Palm oil, Salt. Tastemaker: Hydrolysed peanut protein, Mixed spices.',
      allergens: ['Wheat', 'Peanut']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10012011000168',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Nestle India central manufacturing registration verified.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10012011000168', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Slurrp Farm Millet Hakka Noodles',
    brand: 'Slurrp Farm',
    category: 'Instant Noodles',
    manufacturer: 'Wholsum Foods Pvt. Ltd.',
    barcodeGtIN: '8906114251020',
    packSize: '192g',
    price: 99,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 360,
      protein: 11.5,
      carbohydrates: 72.0,
      sugar: 1.5,
      addedSugar: 0.0,
      fat: 2.2,
      saturatedFat: 0.5,
      transFat: 0.0,
      fiber: 6.8,
      sodium: 210
    },
    ingredient: {
      ingredientText: 'Millet Flour (Foxtail Millet, Little Millet - 50%), Whole Wheat Flour (Atta), Cluster Bean Powder, Salt.',
      allergens: ['Wheat']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10019011006578',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Wholsum Foods manufacturing unit verified on FoSCoS.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10019011006578', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 8. PROTEIN PRODUCTS
  {
    name: 'Optimum Nutrition Gold Standard 100% Whey Double Rich Chocolate',
    brand: 'Optimum Nutrition',
    category: 'Protein Products',
    manufacturer: 'Tirupati Lifesciences Pvt. Ltd.',
    barcodeGtIN: '748927056488',
    packSize: '907g',
    price: 3399,
    imageUrl: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 395,
      protein: 78.0,
      carbohydrates: 9.8,
      sugar: 3.2,
      addedSugar: 0.0,
      fat: 4.8,
      saturatedFat: 2.4,
      transFat: 0.0,
      fiber: 1.6,
      sodium: 430
    },
    ingredient: {
      ingredientText: 'Protein Blend (Whey Protein Isolate, Whey Protein Concentrate), Cocoa Powder, Flavours, Lecithin.',
      allergens: ['Milk', 'Soy']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10016062000334',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Tirupati Lifesciences authorized Glanbia production facility in Paonta Sahib.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10016062000334', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Yoga Bar 20g High Protein Bar Hazelnut Toffee',
    brand: 'Yoga Bar',
    category: 'Protein Products',
    manufacturer: 'Sproutlife Foods Pvt. Ltd.',
    barcodeGtIN: '8906087950348',
    packSize: '70g',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1622484216834-8c88747a8efb?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 398,
      protein: 28.5,
      carbohydrates: 34.0,
      sugar: 6.8,
      addedSugar: 0.0,
      fat: 14.5,
      saturatedFat: 3.2,
      transFat: 0.0,
      fiber: 12.0,
      sodium: 180
    },
    ingredient: {
      ingredientText: 'Whey Protein Concentrate, Almonds, Hazelnuts, Prebiotic Fiber (Oligofructose), Cocoa Butter, Honey.',
      allergens: ['Milk', 'Tree Nuts (Almonds, Hazelnuts)']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10020043003182',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Sproutlife Foods Bangalore manufacturing license verified.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10020043003182', status: 'Active', source: 'FSSAI' }
    ]
  },

  // 9. SNACKS
  {
    name: "Haldiram's Nagpur Aloo Bhujia",
    brand: "Haldiram's",
    category: 'Snacks',
    manufacturer: 'Haldiram Foods International Pvt. Ltd.',
    barcodeGtIN: '8904063201402',
    packSize: '150g',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 578,
      protein: 8.5,
      carbohydrates: 42.0,
      sugar: 2.0,
      addedSugar: 0.0,
      fat: 42.0,
      saturatedFat: 18.0,
      transFat: 0.1,
      fiber: 4.2,
      sodium: 890
    },
    ingredient: {
      ingredientText: 'Potatoes (44%), Edible Vegetable Oil (Palmolein), Bengal Gram Flour, Iodised Salt, Red Chilli Powder, Spices.',
      allergens: []
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10012022000234',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Haldiram Foods International Pvt. Ltd. Nagpur central unit verified.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10012022000234', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'Epigamia Greek Yogurt Natural (Zero Added Sugar)',
    brand: 'Epigamia',
    category: 'Snacks',
    manufacturer: 'Drums Food International Pvt. Ltd.',
    barcodeGtIN: '8906085520019',
    packSize: '90g',
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 90,
      protein: 8.0,
      carbohydrates: 5.0,
      sugar: 4.5,
      addedSugar: 0.0,
      fat: 4.0,
      saturatedFat: 2.5,
      transFat: 0.0,
      fiber: 0.0,
      sodium: 65,
      calcium: 160
    },
    ingredient: {
      ingredientText: 'Pasteurized Double Toned Milk, Milk Solids, Active Live Cultures (S. thermophilus, L. bulgaricus).',
      allergens: ['Milk']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10019022009874',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'Drums Food International manufacturing license verified.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10019022009874', status: 'Active', source: 'FSSAI' }
    ]
  },
  {
    name: 'True Elements Roasted Pumpkin Seeds',
    brand: 'True Elements',
    category: 'Snacks',
    manufacturer: 'HW Wellness Solutions Pvt. Ltd.',
    barcodeGtIN: '8906074900142',
    packSize: '250g',
    price: 299,
    imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80',
    countryOfOrigin: 'India',
    sourceType: 'INTERNAL',
    sourceName: 'PackCheck Verified DB',
    nutrition: {
      servingSize: '100g',
      calories: 560,
      protein: 30.0,
      carbohydrates: 14.0,
      sugar: 1.0,
      addedSugar: 0.0,
      fat: 46.0,
      saturatedFat: 8.5,
      transFat: 0.0,
      fiber: 8.5,
      sodium: 18
    },
    ingredient: {
      ingredientText: '100% Roasted AAA Grade Pumpkin Seeds. Rock Salt (0.2%).',
      allergens: ['Packed in a facility handling tree nuts and seeds']
    },
    verification: {
      authority: 'FSSAI',
      identifier: '10017022006734',
      status: 'Verified',
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in',
      details: 'HW Wellness Solutions certified processing facility on FoSCoS.'
    },
    certifications: [
      { type: 'FSSAI', identifier: '10017022006734', status: 'Active', source: 'FSSAI' }
    ]
  }
];
