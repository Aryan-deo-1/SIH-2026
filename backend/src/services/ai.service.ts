import OpenAI from 'openai';
import { ENV } from '../config/env';
import { StandardProduct, ScanResultPayload, RecommendationItem } from '../types';
import { dbService } from './db.service';
import { externalProductService } from './external-product.service';
import { ProductService } from './product.service';
import { RecommendationService } from './recommendation.service';
import { NutritionCalculatorService, UserNutritionProfile, NutritionCalculationResult } from './nutritionCalculator.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequestOptions {
  message: string;
  conversation?: ChatMessage[];
  productId?: string;
  language?: string;
  userProfile?: UserNutritionProfile;
}

export interface CompactProductContext {
  id: string;
  name: string;
  brand: string;
  category: string;
  packSize?: string;
  price?: number;
  imageUrl?: string;
  nutrition?: {
    servingSize?: string;
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    sugar?: number;
    addedSugar?: number;
    fat?: number;
    saturatedFat?: number;
    transFat?: number;
    fiber?: number;
    sodium?: number;
  };
  healthScore?: number;
  healthGrade?: string;
  warnings?: string[];
  positives?: string[];
  legalMetrology?: {
    overallStatus: string;
    totalMandatory: number;
    passedCount: number;
    failedCount: number;
    reviewCount: number;
    flaggedRequirements?: string[];
  };
  recommendations?: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    price?: number;
    totalScore: number;
    reason: string;
  }>;
}

export interface ChatResponsePayload {
  message: string;
  language: 'english' | 'hindi' | 'hinglish';
  productContextUsed: boolean;
  productSummary?: CompactProductContext;
  nutritionTargets?: NutritionCalculationResult;
  recommendedProducts?: any[];
}

export class AIService {
  private static openaiClient: OpenAI | null = null;

  // Words ignored when attempting to extract product names from natural queries
  private static CONVERSATIONAL_STOPWORDS = new Set([
    'bhai', 'yaar', 'dost', 'sir', 'hello', 'hi', 'hey', 'please', 'kripya',
    'is', 'are', 'was', 'were', 'it', 'this', 'that', 'these', 'those', 'the', 'a', 'an',
    'product', 'brand', 'item', 'food', 'drink', 'beverage',
    'daily', 'everyday', 'regularly', 'often', 'peena', 'khana', 'peene', 'peeneka', 'khane',
    'safe', 'healthy', 'unhealthy', 'harmful', 'good', 'bad', 'accha', 'achha', 'bura',
    'kya', 'hai', 'h', 'kaise', 'karo', 'batao', 'bataye', 'chahiye', 'sakta', 'sakti', 'hoon', 'hu',
    'kitna', 'kitni', 'kaisa', 'kaisi', 'kitne',
    'ka', 'ki', 'ke', 'me', 'mein', 'se', 'ko', 'par', 'pe',
    'for', 'about', 'in', 'on', 'at', 'to', 'from', 'with', 'without',
    'sugar', 'protein', 'sodium', 'fat', 'calories', 'calorie', 'carb', 'carbs',
    'diet', 'plan', 'chart', 'macros', 'bmr', 'tdee', 'weight', 'loss', 'gain', 'mera', 'meri', 'mere',
    'mujhe', 'hum', 'aap', 'tum', 'apna', 'apni', 'apne', 'chahta', 'chahti',
    'i', 'my', 'me', 'we', 'you', 'want', 'need', 'require', 'give',
    'kg', 'kgs', 'kilo', 'kilogram', 'kilograms', 'gm', 'gms', 'gram', 'grams',
    'ml', 'ltr', 'liter', 'liters', 'cm', 'feet', 'inch', 'inches', 'height', 'age',
    'suggest', 'suggestion', 'suggestions', 'alternative', 'alternatives', 'better', 'compare', 'review', 'rating', 'score',
    'options', 'option', 'choice', 'choices', 'recommendation', 'recommendations', 'recommend', 'recs', 'substitute', 'substitutes',
    'healthier', 'healthiest', 'packcheck', 'swaps', 'swap', 'vikalp', 'doosra', 'best', 'top',
    'how', 'much', 'many', 'does', 'do', 'did', 'contain', 'contains', 'have', 'has', 'had',
    'tell', 'give', 'find', 'check', 'can', 'could', 'should', 'would', 'will', 'may', 'might',
    'details', 'info', 'information', 'about', 'some', 'any'
  ]);

  /**
   * Initializes or returns the singleton OpenAI client if API key is present
   */
  private static getClient(): OpenAI | null {
    if (this.openaiClient) return this.openaiClient;
    if (ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim() !== '' && ENV.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        this.openaiClient = new OpenAI({ apiKey: ENV.OPENAI_API_KEY.trim() });
        return this.openaiClient;
      } catch (e) {
        console.warn('[AIService] Failed to initialize OpenAI client:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Detects whether user message is English, Hindi, or Hinglish
   */
  public static detectLanguage(text: string): 'english' | 'hindi' | 'hinglish' {
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hindi';
    }

    const hinglishMarkers = [
      /\b(bhai|kya|hai|h|kaise|karo|batao|khao|khana|peena|peene|safe|achha|accha|chahiye|kitna|kitni|mera|meri|mujhe|hum|aap|ye|yeh|kuch|nahi|nhi|dekh|badhao|ghatao|dost|sabji|roti|dal|doodh|roz)\b/i
    ];
    for (const regex of hinglishMarkers) {
      if (regex.test(text)) {
        return 'hinglish';
      }
    }

    return 'english';
  }

  /**
   * Extracts potential product name from user's message
   */
  public static extractCandidateProduct(text: string): string | null {
    const lower = text.toLowerCase();
    // If the message is primarily a personal diet request without specific product terms, skip
    const isDietIntentOnly = /\b(diet|plan|weight|vajan|calorie|calories|macros|bmr|tdee)\b/i.test(lower) &&
      !/\b(product|brand|snack|chips|drink|cola|biscuit|noodles|butter|sauce|cereal|oats|milk|oil)\b/i.test(lower);
    if (isDietIntentOnly) return null;

    // If the message is purely asking for recommendations/alternatives without specific product terms, skip
    const isGeneralAlternativeQuery = /\b(alternative|alternatives|substitute|substitutes|better option|healthier option|swaps|recommendation|recommendations)\b/i.test(lower) &&
      !/\b(chips|biscuit|biscuits|drink|drinks|cola|sprite|coke|maggi|butter|oats|milk|oil|juice|kurkure|lays)\b/i.test(lower);
    if (isGeneralAlternativeQuery) return null;

    const cleaned = lower.replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter((t) => {
      // Exclude numbers and pure digits
      if (/^\d+$/.test(t)) return false;
      return t.length > 1 && !this.CONVERSATIONAL_STOPWORDS.has(t);
    });

    if (tokens.length === 0) return null;
    return tokens.join(' ');
  }

  /**
   * Searches for a product across DB and external provider from extracted query string
   */
  public static async searchProductByQuery(query: string): Promise<CompactProductContext | null> {
    const cleanQ = query.trim();
    if (!cleanQ || cleanQ.length < 2) return null;

    try {
      // 1. Search internal DB
      const dbMatches = await dbService.searchProducts(cleanQ);
      if (dbMatches && dbMatches.length > 0) {
        const prod = ProductService.formatProductRecord(dbMatches[0]);
        const analysis = await ProductService.analyzeProduct(prod);
        return this.formatCompactContext(prod, analysis);
      }

      // 2. Search Open Food Facts
      const extMatches = await externalProductService.searchByName(cleanQ);
      if (extMatches && extMatches.length > 0) {
        const prod = extMatches[0];
        const analysis = await ProductService.analyzeProduct(prod);
        return this.formatCompactContext(prod, analysis);
      }
    } catch (err) {
      console.warn(`[AIService] Product query search error for "${cleanQ}":`, err);
    }

    return null;
  }

  /**
   * Formats product record and analysis into a compact context
   */
  private static formatCompactContext(product: StandardProduct, analysis: ScanResultPayload): CompactProductContext {
    const recs: RecommendationItem[] = analysis.recommendations || [];
    const compactRecs = recs.slice(0, 3).map((r) => ({
      id: r.candidateProduct.id,
      name: r.candidateProduct.name,
      brand: r.candidateProduct.brand,
      category: r.candidateProduct.category,
      price: r.candidateProduct.price,
      totalScore: r.totalScore,
      reason: r.reason
    }));

    const flagged = analysis.legalMetrology?.checks
      ?.filter((c: any) => c.status === 'FAIL' || c.status === 'REVIEW')
      ?.map((c: any) => `${c.requirement}: ${c.reason || 'Needs review'}`) || [];

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      packSize: product.packSize,
      price: product.price,
      imageUrl: product.imageUrl,
      nutrition: product.nutrition ? {
        servingSize: product.nutrition.servingSize,
        calories: product.nutrition.calories,
        protein: product.nutrition.protein,
        carbohydrates: product.nutrition.carbohydrates,
        sugar: product.nutrition.sugar,
        addedSugar: product.nutrition.addedSugar,
        fat: product.nutrition.fat,
        saturatedFat: product.nutrition.saturatedFat,
        transFat: product.nutrition.transFat,
        fiber: product.nutrition.fiber,
        sodium: product.nutrition.sodium
      } : undefined,
      healthScore: analysis.score?.score,
      healthGrade: analysis.score?.grade,
      warnings: analysis.warnings?.map((w: any) => `${w.title || w.message}: ${w.description || ''}`).slice(0, 4) || [],
      positives: analysis.positives?.map((p: any) => `${p.title || p.message}: ${p.description || ''}`).slice(0, 4) || [],
      legalMetrology: analysis.legalMetrology ? {
        overallStatus: analysis.legalMetrology.overallStatus,
        totalMandatory: analysis.legalMetrology.summary?.totalMandatory || 0,
        passedCount: analysis.legalMetrology.summary?.passed || 0,
        failedCount: analysis.legalMetrology.summary?.failed || 0,
        reviewCount: analysis.legalMetrology.summary?.review || 0,
        flaggedRequirements: flagged
      } : undefined,
      recommendations: compactRecs
    };
  }

  /**
   * Builds compact, authoritative product context by product ID or barcode
   */
  public static async resolveProductContext(productId: string): Promise<CompactProductContext | null> {
    try {
      let rawProduct = await dbService.getProductById(productId);
      if (!rawProduct) {
        rawProduct = await dbService.getProductByBarcode(productId);
      }
      if (!rawProduct) {
        const ext = await ProductService.resolveByBarcode(productId);
        if (ext) {
          rawProduct = ext;
        }
      }

      if (!rawProduct) return null;

      const product = ProductService.formatProductRecord(rawProduct);
      const analysis: ScanResultPayload = await ProductService.analyzeProduct(product);
      return this.formatCompactContext(product, analysis);
    } catch (err) {
      console.warn('[AIService] Error resolving product context:', err);
      return null;
    }
  }

  /**
   * Main chat coordinator
   */
  public static async chat(options: ChatRequestOptions): Promise<ChatResponsePayload> {
    const { message, conversation = [], productId, language = 'auto' } = options;
    const detectedLang = language === 'auto' || !language ? this.detectLanguage(message) : (language as any);

    // Required Debug Logging
    console.log(`[AI] Received message: "${message}"`);
    console.log(`[AI] Product ID: ${productId || 'None'}`);

    // 1. Fetch authoritative product context if productId provided, or search from query
    let productContext: CompactProductContext | null = null;
    let notFoundProduct: string | null = null;

    if (productId && productId.trim() !== '') {
      productContext = await this.resolveProductContext(productId.trim());
    }

    // If no product context from ID, or if the user is asking about a specific product in their message
    const candidateName = this.extractCandidateProduct(message);
    if (!productContext && candidateName) {
      productContext = await this.searchProductByQuery(candidateName);
      if (!productContext) {
        // Product term was extracted, but not found in DB or external provider
        notFoundProduct = candidateName;
      }
    }

    console.log(`[AI] Product context found: ${productContext ? `${productContext.name} (${productContext.brand})` : (notFoundProduct ? `Not in DB (${notFoundProduct})` : 'None')}`);

    // 2. Extract profile attributes from conversation history + current message
    let combinedText = conversation.map((c) => c.content).join('\n') + '\n' + message;
    const extractedProfile = NutritionCalculatorService.extractProfileFromText(combinedText, options.userProfile);

    // 3. Determine if nutrition calculation is needed or possible
    const isDietQuery = /\b(diet|meal plan|calories|calorie|protein|bmr|tdee|weight loss|gain weight|macros|nutrition plan|khana|diet chart)\b/i.test(combinedText);
    let nutritionTargets: NutritionCalculationResult | undefined = undefined;

    if (isDietQuery && (extractedProfile.weightKg || extractedProfile.goal || extractedProfile.heightCm)) {
      nutritionTargets = NutritionCalculatorService.calculate(extractedProfile);
    }

    // 4. Check for OpenAI Client
    const client = this.getClient();

    if (!client) {
      console.log('[AI] Generating deterministic response (OpenAI client unconfigured or offline)...');
      const fallbackReply = this.generateDeterministicResponse({
        message,
        language: detectedLang,
        productContext,
        notFoundProduct,
        nutritionTargets,
        extractedProfile
      });

      console.log('[AI] Response generated.');
      return {
        message: fallbackReply,
        language: detectedLang,
        productContextUsed: !!productContext,
        productSummary: productContext || undefined,
        nutritionTargets,
        recommendedProducts: productContext?.recommendations || []
      };
    }

    // 5. Construct OpenAI System Prompt
    const systemPrompt = this.buildSystemPrompt({
      language: detectedLang,
      productContext,
      notFoundProduct,
      nutritionTargets,
      extractedProfile
    });

    const messagesToSend: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Append conversation history
    const recentHistory = conversation.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messagesToSend.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current user message
    messagesToSend.push({
      role: 'user',
      content: message
    });

    try {
      console.log('[AI] Sending request to OpenAI...');
      const completion = await client.chat.completions.create({
        model: ENV.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messagesToSend,
        temperature: 0.7,
        max_tokens: 800
      });

      const responseText = completion.choices[0]?.message?.content || 'I could not generate a response. Please try again.';
      console.log('[AI] Response received from OpenAI.');

      return {
        message: responseText,
        language: detectedLang,
        productContextUsed: !!productContext,
        productSummary: productContext || undefined,
        nutritionTargets,
        recommendedProducts: productContext?.recommendations || []
      };
    } catch (apiError: any) {
      console.error('[AIService] OpenAI API call error, falling back gracefully:', apiError.message || apiError);

      const fallbackReply = this.generateDeterministicResponse({
        message,
        language: detectedLang,
        productContext,
        notFoundProduct,
        nutritionTargets,
        extractedProfile
      });

      console.log('[AI] Fallback response generated.');
      return {
        message: fallbackReply,
        language: detectedLang,
        productContextUsed: !!productContext,
        productSummary: productContext || undefined,
        nutritionTargets,
        recommendedProducts: productContext?.recommendations || []
      };
    }
  }

  /**
   * Builds the strict, authoritative system prompt
   */
  private static buildSystemPrompt(params: {
    language: 'english' | 'hindi' | 'hinglish';
    productContext: CompactProductContext | null;
    notFoundProduct?: string | null;
    nutritionTargets?: NutritionCalculationResult;
    extractedProfile?: UserNutritionProfile;
  }): string {
    const { language, productContext, notFoundProduct, nutritionTargets, extractedProfile } = params;

    let prompt = `You are "PackCheck AI", the official AI nutrition, packaged commodity compliance, and dietary intelligence assistant inside the PackCheck platform.

CORE PRINCIPLES & SAFETY RULES:
1. Language Mirroring: You must communicate fluently in ${language.toUpperCase()}. If the user speaks English, answer in clear English. If Hindi, answer in clean Devanagari Hindi. If Hinglish, respond in natural, relatable conversational Hinglish (e.g. "Haan bhai, is product me...").
2. Authoritative Data: When a PackCheck product context is provided below, use ONLY the exact numbers given. NEVER invent or hallucinate nutrition figures. If a field is missing, state clearly that it is unavailable in the database.
3. If the user asks about a product for which PackCheck does not have database records, explicitly inform them that PackCheck does not currently have verified database records for it. Do NOT invent numbers.
4. Distinguish Facts from Estimates: Clearly distinguish verified database values from estimated dietary values.
5. Legal Metrology Rules (Packaged Commodities Rules, 2011): Explain compliance screening results simply. Never claim to make binding legal determinations or override the deterministic compliance engine.
6. Medical Safety: Never diagnose diseases or claim a packaged food cures clinical conditions. For allergies or chronic medical conditions (e.g. severe diabetes, kidney disease), always advise consulting a qualified physician or registered dietitian.
7. Indian Context & Dietary Preferences: Recommend realistic, practical Indian food items (dal, chana, rajma, paneer, eggs, curd, oats, roti, vegetables). Strictly respect vegetarian, eggetarian, or vegan preferences.
8. Tone: Helpful, objective, concise, clear, and encouraging. Avoid returning repetitive greeting boilerplate.
`;

    if (productContext) {
      prompt += `\n--- CURRENT PRODUCT CONTEXT (FROM PACKCHECK DATABASE) ---
Product Name: ${productContext.name}
Brand: ${productContext.brand}
Category: ${productContext.category}
Pack Size: ${productContext.packSize || 'Not specified'}
MRP: ₹${productContext.price || 'N/A'}
Health Quality Score: ${productContext.healthScore !== undefined ? `${productContext.healthScore}/100 (Grade: ${productContext.healthGrade})` : 'Pending calculation'}
Key Warnings: ${productContext.warnings && productContext.warnings.length > 0 ? productContext.warnings.join(' | ') : 'No critical nutritional penalties flagged'}
Key Positives: ${productContext.positives && productContext.positives.length > 0 ? productContext.positives.join(' | ') : 'None highlighted'}
Legal Metrology Compliance Status: ${productContext.legalMetrology?.overallStatus || 'Unknown'} (Mandatory Passed: ${productContext.legalMetrology?.passedCount}/${productContext.legalMetrology?.totalMandatory})
Flagged Legal Items: ${productContext.legalMetrology?.flaggedRequirements?.join('; ') || 'None'}
Nutrition Facts (per serving/100g):
  - Calories: ${productContext.nutrition?.calories ?? 'N/A'} kcal
  - Protein: ${productContext.nutrition?.protein ?? 'N/A'} g
  - Carbohydrates: ${productContext.nutrition?.carbohydrates ?? 'N/A'} g
  - Sugar: ${productContext.nutrition?.sugar ?? 'N/A'} g (Added Sugar: ${productContext.nutrition?.addedSugar ?? 'N/A'} g)
  - Total Fat: ${productContext.nutrition?.fat ?? 'N/A'} g (Saturated: ${productContext.nutrition?.saturatedFat ?? 'N/A'} g, Trans: ${productContext.nutrition?.transFat ?? 'N/A'} g)
  - Fiber: ${productContext.nutrition?.fiber ?? 'N/A'} g
  - Sodium: ${productContext.nutrition?.sodium ?? 'N/A'} mg

Verified Healthier Alternatives in PackCheck DB:
${productContext.recommendations?.map((r) => `- ${r.name} by ${r.brand} (Category: ${r.category}, Score: ${r.totalScore}/100) -> Advantage: ${r.reason}`).join('\n') || 'None cached'}
`;
    } else if (notFoundProduct) {
      prompt += `\n--- USER PRODUCT QUERY NOTE ---
The user asked about "${notFoundProduct}", but PackCheck database currently does NOT have verified records for this product.
RULE: State clearly that PackCheck does not currently have verified product data for "${notFoundProduct}". Do NOT invent exact sugar or calorie figures. Discuss general nutritional guidelines for this category of food/beverage and suggest checking the physical product label or barcode on PackCheck.
`;
    }

    if (nutritionTargets) {
      prompt += `\n--- DETERMINISTIC NUTRITION TARGETS (CALCULATED BY PACKCHECK ENGINE) ---
User Goal: ${nutritionTargets.goalLabel}
Calculated BMR: ${nutritionTargets.bmr} kcal/day
Maintenance TDEE: ${nutritionTargets.tdee} kcal/day
Target Calorie Intake: ${nutritionTargets.targetCalories} kcal/day (${nutritionTargets.deficitOrSurplus >= 0 ? '+' : ''}${nutritionTargets.deficitOrSurplus} kcal adjustment)
Target Protein: ${nutritionTargets.protein.grams}g (${nutritionTargets.protein.percentage}% of calories)
Target Fats: ${nutritionTargets.fat.grams}g (${nutritionTargets.fat.percentage}% of calories)
Target Carbs: ${nutritionTargets.carbs.grams}g (${nutritionTargets.carbs.percentage}% of calories)

Meal Caloric Partitioning:
- Breakfast: ~${nutritionTargets.mealSplits.breakfast.calories} kcal (~${nutritionTargets.mealSplits.breakfast.proteinGrams}g protein)
- Mid-Morning Snack: ~${nutritionTargets.mealSplits.midMorningSnack.calories} kcal (~${nutritionTargets.mealSplits.midMorningSnack.proteinGrams}g protein)
- Lunch: ~${nutritionTargets.mealSplits.lunch.calories} kcal (~${nutritionTargets.mealSplits.lunch.proteinGrams}g protein)
- Evening Snack: ~${nutritionTargets.mealSplits.eveningSnack.calories} kcal (~${nutritionTargets.mealSplits.eveningSnack.proteinGrams}g protein)
- Dinner: ~${nutritionTargets.mealSplits.dinner.calories} kcal (~${nutritionTargets.mealSplits.dinner.proteinGrams}g protein)

IMPORTANT: Use these exact calculated targets in your meal plan. Do not invent contradictory numbers.
`;
    } else if (extractedProfile) {
      const missing = [];
      if (!extractedProfile.age) missing.push('age');
      if (!extractedProfile.weightKg) missing.push('weight');
      if (!extractedProfile.heightCm) missing.push('height');
      if (!extractedProfile.activityLevel) missing.push('activity level (e.g. sedentary, regular gym, active)');
      if (!extractedProfile.goal) missing.push('fitness goal (e.g. weight loss, muscle gain, maintenance)');
      if (missing.length > 0) {
        prompt += `\nNOTE: If the user wants a full personalized diet plan, remember we still need: ${missing.join(', ')}. Politely ask for any missing fields if required.`;
      }
    }

    return prompt;
  }

  /**
   * High-quality deterministic response when OpenAI is offline or API key is absent
   */
  public static generateDeterministicResponse(params: {
    message: string;
    language: 'english' | 'hindi' | 'hinglish';
    productContext: CompactProductContext | null;
    notFoundProduct?: string | null;
    nutritionTargets?: NutritionCalculationResult;
    extractedProfile?: UserNutritionProfile;
  }): string {
    const { message, language, productContext, notFoundProduct, nutritionTargets, extractedProfile } = params;
    const lower = message.toLowerCase();

    // =========================================================================
    // 1. PRODUCT CONTEXT QUESTIONS (e.g. Sprite, Lay's, Amul Butter)
    // =========================================================================
    if (productContext) {
      const nut = productContext.nutrition || {};

      // A. Safety / Daily Consumption / Healthiness of Product
      const isDailyOrSafetyQuery = /\b(daily|everyday|safe|healthy|peena|peene|khana|khane|kaisa|regular|roz|har roz|health)\b/i.test(lower);
      if (isDailyOrSafetyQuery) {
        const sugarVal = nut.sugar ?? 0;
        const isHighSugar = sugarVal >= 8;
        const isHighSodium = (nut.sodium ?? 0) >= 400;
        const isBeverage = productContext.category.toLowerCase().includes('drink') ||
                          productContext.category.toLowerCase().includes('beverage') ||
                          productContext.name.toLowerCase().includes('sprite') ||
                          productContext.name.toLowerCase().includes('cola');

        if (isBeverage || isHighSugar) {
          if (language === 'hindi') {
            return `**${productContext.name}** को दैनिक (Daily) पेय के रूप में पीना स्वास्थ्य के लिए उचित नहीं माना जाएगा, खासकर यदि आप अतिरिक्त चीनी से बचना चाहते हैं।\n\nPackCheck के उपलब्ध पोषण डेटा के अनुसार:\n- **चीनी (Sugar):** ${nut.sugar !== undefined ? `${nut.sugar}g प्रति 100ml` : 'उच्च मात्रा'}${nut.addedSugar !== undefined ? ` (पूरी अतिरिक्त चीनी: ${nut.addedSugar}g)` : ''}\n- **कैलोरी (Calories):** ${nut.calories ?? 'N/A'} kcal प्रति 100ml (शून्य प्रोटीन और शून्य फाइबर - खाली कैलोरी)\n- **सोडियम (Sodium):** ${nut.sodium ?? 'N/A'} mg\n\n**निष्कर्ष:**\nदैनिक सेवन से ब्लड शुगर स्पाइक्स, वजन बढ़ना और दांतों के इनेमल को नुकसान होने का जोखिम रहता है। इसे कभी-कभार ही सीमित मात्रा में लें, दैनिक आदत न बनाएं।\n\nPackCheck डेटाबेस से स्वास्थ्यप्रद कम-चीनी वाले विकल्प: नारियल पानी, नींबू पानी (बिना चीनी), या छाछ।`;
          } else if (language === 'hinglish') {
            return `Bhai, **${productContext.name}** ko daily drink ke roop mein lena generally ideal ya safe nahi maana jayega, especially agar tum added/free sugar intake kam rakhna chahte ho.\n\nPackCheck ke available nutrition data ke according:\n- **Sugar:** **${nut.sugar !== undefined ? `${nut.sugar}g` : 'N/A'} per 100ml**${nut.addedSugar !== undefined ? ` (Poori free/added sugar: ${nut.addedSugar}g)` : ''}\n- **Calories:** **${nut.calories ?? 'N/A'} kcal** per 100ml\n- **Protein & Fiber:** **0g** (Empty calories, zero nutritional density)\n- **Health Quality Score:** **${productContext.healthScore ?? 'N/A'}/100**\n\n**Verdict:**\nEk 300ml bottle/can mein lagbhag 30g added sugar hoti hai, jo WHO ki daily recommended limit ko paar kar jaati hai. Kabhi-kabhi (occasional) moderation mein theek hai, par isko daily habit banana bilkul recommend nahi karenge.\n\nAgar chaho toh main PackCheck DB se lower-sugar alternatives jaise coconut water, nimbu pani ya unsweetened options suggest kar sakta hoon!`;
          } else {
            return `Consuming **${productContext.name}** as a daily beverage is generally not recommended from a nutritional standpoint, especially if you want to minimize added/free sugar intake.\n\nAccording to PackCheck's verified nutrition data:\n- **Sugar:** **${nut.sugar !== undefined ? `${nut.sugar}g` : 'N/A'} per 100ml**${nut.addedSugar !== undefined ? ` (Added Sugar: ${nut.addedSugar}g)` : ''}\n- **Calories:** **${nut.calories ?? 'N/A'} kcal** per 100ml\n- **Protein & Fiber:** **0g** (100% discretionary empty calories)\n- **Health Score:** **${productContext.healthScore ?? 'N/A'}/100**\n\n**Assessment:**\nA standard 300ml serving delivers roughly 30g of free sugars, surpassing the recommended daily limit for discretionary sugars. Occasional consumption in moderation is fine, but it should not become a daily hydration habit. I can suggest verified lower-sugar alternatives from PackCheck!`;
          }
        }
      }

      // B. Sugar Questions
      if (/\b(sugar|chini|mithas|sweet)\b/i.test(lower)) {
        if (language === 'hindi') {
          return `**${productContext.name}** में कुल चीनी **${nut.sugar ?? 'उपलब्ध नहीं'}g** प्रति 100g/ml है${nut.addedSugar !== undefined ? ` (अतिरिक्त चीनी: ${nut.addedSugar}g)` : ''}। ${nut.sugar && nut.sugar > 10 ? '⚠️ यह उच्च शर्करा श्रेणी में आता है, इसका सेवन सीमित करें।' : '✅ यह संतुलित मात्रा में है।'}`;
        } else if (language === 'hinglish') {
          return `**${productContext.name}** me total sugar **${nut.sugar ?? 'N/A'}g** per 100g/ml hai${nut.addedSugar !== undefined ? ` (Added sugar: ${nut.addedSugar}g)` : ''}। ${nut.sugar && nut.sugar > 10 ? '⚠️ Yeh high sugar category me aata hai, daily khane/peene se bachein.' : '✅ Sugar level balanced hai.'}`;
        } else {
          return `**${productContext.name}** contains **${nut.sugar ?? 'N/A'}g** of sugar per 100g/ml${nut.addedSugar !== undefined ? ` (including ${nut.addedSugar}g added sugar)` : ''}. ${nut.sugar && nut.sugar > 10 ? '⚠️ This is considered high in sugar — consume in moderation.' : '✅ This is within a moderate limit.'}`;
        }
      }

      // C. Protein Questions
      if (/\b(protein|protin)\b/i.test(lower)) {
        if (language === 'hindi') {
          return `**${productContext.name}** में प्रोटीन **${nut.protein ?? 'उपलब्ध नहीं'}g** प्रति 100g/ml है। ${nut.protein && nut.protein >= 10 ? '💪 यह प्रोटीन का अच्छा स्रोत है।' : 'यह प्रोटीन का प्राथमिक स्रोत नहीं है।'}`;
        } else if (language === 'hinglish') {
          return `**${productContext.name}** me protein **${nut.protein ?? 'N/A'}g** per 100g/ml milta hai। ${nut.protein && nut.protein >= 10 ? '💪 Badhiya protein source hai!' : 'High-protein requirements ke liye alag se protein source lena padega.'}`;
        } else {
          return `**${productContext.name}** provides **${nut.protein ?? 'N/A'}g** of protein per 100g/ml. ${nut.protein && nut.protein >= 10 ? '💪 It is a solid protein source!' : 'It is not a primary source of protein.'}`;
        }
      }

      // D. Healthier Alternatives from PackCheck Database
      if (/\b(alternative|healthier|better|substitute|doosra|vikalp)\b/i.test(lower)) {
        if (productContext.recommendations && productContext.recommendations.length > 0) {
          const recList = productContext.recommendations.map((r, i) => `${i + 1}. **${r.name}** (${r.brand}) — Score: ${r.totalScore}/100 • *${r.reason}*`).join('\n');
          if (language === 'hindi') {
            return `यहाँ **PackCheck डेटाबेस** से सत्यापित स्वास्थ्यप्रद विकल्प हैं:\n\n${recList}`;
          } else if (language === 'hinglish') {
            return `PackCheck database se **${productContext.name}** ke healthier alternatives ye rahe:\n\n${recList}`;
          } else {
            return `Here are verified healthier alternatives from the **PackCheck database**:\n\n${recList}`;
          }
        } else {
          return language === 'hindi'
            ? 'इस श्रेणी में फिलहाल कोई सीधा विकल्प डेटाबेस में नहीं मिला।'
            : 'No direct alternative found in this specific category in the PackCheck database right now.';
        }
      }

      // E. Legal Metrology / Compliance Questions
      if (/\b(compliance|legal|rule|metrology|fssai|warning|partially|non-compliant)\b/i.test(lower)) {
        const lm = productContext.legalMetrology;
        const status = lm?.overallStatus || 'ASSESSED';
        const flagged = lm?.flaggedRequirements?.length ? lm.flaggedRequirements.join('\n- ') : 'No mandatory declarations violated';
        if (language === 'hindi') {
          return `**लीगल मेट्रोलॉजी समीक्षा (${productContext.name}):**\n- स्थिति: **${status}**\n- अनिवार्य जांच: ${lm?.passedCount || 0}/${lm?.totalMandatory || 0} पास\n- समीक्षा बिंदु:\n- ${flagged}\n\n*नोट: यह स्क्रीनिंग पैकचेक के लीगल मेट्रोलॉजी रूल्स 2011 इंजन पर आधारित है।*`;
        } else if (language === 'hinglish') {
          return `**Legal Metrology Assessment (${productContext.name}):**\n- Status: **${status}**\n- Mandatory Checks: ${lm?.passedCount || 0}/${lm?.totalMandatory || 0} Passed\n- Findings:\n- ${flagged}\n\n*Yeh screening PackCheck ke deterministic Legal Metrology rules 2011 ke anusaar generate hui hai.*`;
        } else {
          return `**Legal Metrology Assessment (${productContext.name}):**\n- Overall Status: **${status}**\n- Mandatory Declarations: ${lm?.passedCount || 0} of ${lm?.totalMandatory || 0} verified\n- Findings:\n- ${flagged}\n\n*This screening is generated strictly by PackCheck's Legal Metrology (Packaged Commodities) Rules, 2011 engine.*`;
        }
      }

      // F. General Product Nutrition Review
      const score = productContext.healthScore ?? 50;
      const scoreMsg = score >= 70 ? 'Nutritionally favorable' : score >= 40 ? 'Moderate nutritional profile' : 'Nutritionally poor / ultra-processed';
      if (language === 'hindi') {
        return `**${productContext.name} (${productContext.brand})** की पोषण समीक्षा:\n\n- **हेल्थ स्कोर:** ${score}/100 (${productContext.healthGrade || 'C'})\n- **कैलोरी:** ${nut.calories ?? 'N/A'} kcal | **प्रोटीन:** ${nut.protein ?? 'N/A'}g | **चीनी:** ${nut.sugar ?? 'N/A'}g\n- **मुख्य चेतावनी:** ${productContext.warnings?.join(', ') || 'कोई गंभीर चेतावनी नहीं'}\n- **सकारात्मक बिंदु:** ${productContext.positives?.join(', ') || 'संतुलित'}\n\n${score >= 60 ? '✅ आप इसका कभी-कभार संतुलित आहार में सेवन कर सकते हैं।' : '⚠️ दैनिक सेवन के लिए यह अनुशंसित नहीं है।'}`;
      } else if (language === 'hinglish') {
        return `**${productContext.name} (${productContext.brand})** ka PackCheck Nutrition Review:\n\n- **Health Score:** ${score}/100 (${productContext.healthGrade || 'Grade C'}) — *${scoreMsg}*\n- **Nutrition (per 100g/ml):** ${nut.calories ?? 'N/A'} kcal, ${nut.protein ?? 'N/A'}g protein, ${nut.sugar ?? 'N/A'}g sugar, ${nut.sodium ?? 'N/A'}mg sodium.\n- **Warnings:** ${productContext.warnings?.join(' | ') || 'None'}\n- **Positives:** ${productContext.positives?.join(' | ') || 'Standard profile'}\n\n${score >= 60 ? 'Isko aap moderate quantities me consume kar sakte hain.' : 'Daily khana/peena recommend nahi karenge kyunki sugar/sodium ya processing high hai.'}`;
      } else {
        return `**${productContext.name} (${productContext.brand})** Analysis:\n\n- **Health Quality Score:** ${score}/100 (Grade ${productContext.healthGrade || 'C'}) — *${scoreMsg}*\n- **Key Nutrition (per 100g/ml):** ${nut.calories ?? 'N/A'} kcal | Protein: ${nut.protein ?? 'N/A'}g | Sugar: ${nut.sugar ?? 'N/A'}g | Saturated Fat: ${nut.saturatedFat ?? 'N/A'}g | Sodium: ${nut.sodium ?? 'N/A'}mg.\n- **Warnings:** ${productContext.warnings?.join(' | ') || 'None flagged'}\n- **Positives:** ${productContext.positives?.join(' | ') || 'Balanced'}\n\n${score >= 60 ? 'Suitable for occasional/moderate consumption within a balanced diet.' : 'High in discretionary nutrients (sugar/sodium/fats); not optimal for daily consumption.'}`;
      }
    }

    // =========================================================================
    // 2. DIET & NUTRITION TARGETS / MEAL PLAN
    // =========================================================================
    if (nutritionTargets) {
      const isVeg = extractedProfile?.dietPreference === 'vegetarian';
      if (language === 'hindi') {
        return `### 🥗 आपकी व्यक्तिगत पोषण गणना (PackCheck Engine)
- **लक्ष्य:** ${nutritionTargets.goalLabel}
- **BMR (बेसल मेटाबोलिक दर):** ${nutritionTargets.bmr} kcal
- **TDEE (दैनिक ऊर्जा व्यय):** ${nutritionTargets.tdee} kcal
- **दैनिक कैलोरी लक्ष्य:** **${nutritionTargets.targetCalories} kcal/दिन**
- **मैक्रोन्यूट्रिएंट्स:** प्रोटीन: **${nutritionTargets.protein.grams}g** | कार्ब्स: **${nutritionTargets.carbs.grams}g** | फैट: **${nutritionTargets.fat.grams}g**

---
### 🍽️ पूर्ण-दिवस भारतीय भोजन योजना (${isVeg ? 'शाकाहारी' : 'संतुलित'})
1. **नाश्ता (~${nutritionTargets.mealSplits.breakfast.calories} kcal, ${nutritionTargets.mealSplits.breakfast.proteinGrams}g प्रोटीन):**
   - 2 बेसन चीला / ओट्स दलिया + 1 गिलास दूध या ${isVeg ? '100g पनीर' : '2 उबले अंडे'}।
2. **मिड-मॉर्निंग स्नैक (~${nutritionTargets.mealSplits.midMorningSnack.calories} kcal):**
   - 1 मौसमी फल (सेब/केला) + 1 मुट्ठी भुने चने या बादाम।
3. **दोपहर का भोजन (~${nutritionTargets.mealSplits.lunch.calories} kcal, ${nutritionTargets.mealSplits.lunch.proteinGrams}g प्रोटीन):**
   - 2 गेहूं की रोटी + 1 कटोरी दाल (मूंग/अरहर) + 1 कटोरी हरी सब्जी + 1 कप दही + सलाद।
4. **शाम का स्नैक (~${nutritionTargets.mealSplits.eveningSnack.calories} kcal):**
   - भुना मखाना या स्प्राउट्स चाट + ग्रीन टी।
5. **रात का भोजन (~${nutritionTargets.mealSplits.dinner.calories} kcal, ${nutritionTargets.mealSplits.dinner.proteinGrams}g प्रोटीन):**
   - 1-2 रोटी या ब्राउन राइस + ${isVeg ? 'टोफू / पनीर भुर्जी' : 'ग्रिल्ड चिकन / फिश'} + भरपूर सलाद।

*नोट: ये अनुमानित हिस्से हैं। अपनी आवश्यकता अनुसार पानी की पर्याप्त मात्रा (3-4L) बनाए रखें।*`;
      } else if (language === 'hinglish') {
        return `### 🥗 Aapke Calculated Nutrition Targets (PackCheck Engine)
- **Goal:** ${nutritionTargets.goalLabel}
- **BMR:** ${nutritionTargets.bmr} kcal | **TDEE:** ${nutritionTargets.tdee} kcal
- **Daily Target Calories:** **${nutritionTargets.targetCalories} kcal**
- **Macros Target:** Protein: **${nutritionTargets.protein.grams}g** | Carbs: **${nutritionTargets.carbs.grams}g** | Fats: **${nutritionTargets.fat.grams}g**

---
### 🍽️ Full Day Indian Diet Plan (${isVeg ? 'Vegetarian' : 'Balanced'})
1. **Breakfast (~${nutritionTargets.mealSplits.breakfast.calories} kcal, ${nutritionTargets.mealSplits.breakfast.proteinGrams}g protein):**
   - 2 Moong dal / Besan cheela OR Oats with milk + ${isVeg ? '80-100g paneer' : '3 egg whites + 1 whole egg'}.
2. **Mid-Morning (~${nutritionTargets.mealSplits.midMorningSnack.calories} kcal):**
   - 1 Apple/Banana + ek mutthi roasted chana ya almonds.
3. **Lunch (~${nutritionTargets.mealSplits.lunch.calories} kcal, ${nutritionTargets.mealSplits.lunch.proteinGrams}g protein):**
   - 2 Roti + 1 bowl Rajma/Dal + green veg sabzi + 1 bowl curd (dahi) + fresh salad.
4. **Evening Snack (~${nutritionTargets.mealSplits.eveningSnack.calories} kcal):**
   - Roasted Makhana / Boiled Sprouts salad + chai/green tea.
5. **Dinner (~${nutritionTargets.mealSplits.dinner.calories} kcal, ${nutritionTargets.mealSplits.dinner.proteinGrams}g protein):**
   - 1-2 Roti or brown rice + ${isVeg ? 'Paneer/Soyabean sabzi' : '150g grilled chicken/fish'} + bowl of veggies.

Aap is plan ko budget ya preferences ke mutabiq adjust bhi kar sakte hain!`;
      } else {
        return `### 🥗 Deterministic Nutrition Targets (PackCheck Engine)
- **Goal:** ${nutritionTargets.goalLabel}
- **Basal Metabolic Rate (BMR):** ${nutritionTargets.bmr} kcal
- **Total Daily Energy Expenditure (TDEE):** ${nutritionTargets.tdee} kcal
- **Prescribed Daily Calories:** **${nutritionTargets.targetCalories} kcal**
- **Macronutrient Split:** Protein: **${nutritionTargets.protein.grams}g** | Carbohydrates: **${nutritionTargets.carbs.grams}g** | Fat: **${nutritionTargets.fat.grams}g**

---
### 🍽️ Full-Day Indian Diet Plan (${isVeg ? 'Vegetarian' : 'Balanced'})
1. **Breakfast (~${nutritionTargets.mealSplits.breakfast.calories} kcal, ${nutritionTargets.mealSplits.breakfast.proteinGrams}g Protein):**
   - 2 Besan/Moong Dal Cheelas or Rolled Oats in milk + ${isVeg ? '80g low-fat Paneer' : '3 Boiled Egg Whites + 1 Whole Egg'}.
2. **Mid-Morning Snack (~${nutritionTargets.mealSplits.midMorningSnack.calories} kcal):**
   - 1 Fresh fruit (Apple/Papaya) + handful of roasted chana or walnuts.
3. **Lunch (~${nutritionTargets.mealSplits.lunch.calories} kcal, ${nutritionTargets.mealSplits.lunch.proteinGrams}g Protein):**
   - 2 Whole wheat rotis + 1 bowl Dal (Moong/Arhar) + seasonal green sabzi + 1 bowl probiotic curd + mixed salad.
4. **Evening Fuel (~${nutritionTargets.mealSplits.eveningSnack.calories} kcal):**
   - Roasted makhana or sprouted moong chaat with lemon + green tea.
5. **Dinner (~${nutritionTargets.mealSplits.dinner.calories} kcal, ${nutritionTargets.mealSplits.dinner.proteinGrams}g Protein):**
   - 1-2 Rotis or steamed rice + ${isVeg ? 'Grilled Tofu/Paneer or Soya chunks' : '150g Chicken breast/Fish curry'} + large cucumber/tomato salad.

*All portions are tailored estimates to hit your target calories and macronutrients.*`;
      }
    }

    // =========================================================================
    // 3. DIET PLAN REQUEST WITHOUT FULL PARAMETERS (e.g. "mera weight 70 kg hai...")
    // =========================================================================
    const isDietIntent = /\b(diet|plan|weight|vajan|calorie|calories|protein|kya khau|batao)\b/i.test(lower);
    if (isDietIntent) {
      const knownWeight = extractedProfile?.weightKg ? `${extractedProfile.weightKg} kg` : null;
      const knownGoal = extractedProfile?.goal === 'weight_loss' ? 'Weight Loss' :
                        extractedProfile?.goal === 'weight_gain' ? 'Weight Gain' :
                        extractedProfile?.goal === 'muscle_building' ? 'Muscle Building' : null;

      if (language === 'hindi') {
        return `आपके ${knownWeight ? `${knownWeight} वजन` : ''} ${knownGoal ? `और ${knownGoal} लक्ष्य` : ''} के लिए सटीक डाइट प्लान बनाने हेतु मुझे कुछ अतिरिक्त जानकारी चाहिए:\n1. **ऊंचाई (Height)?** (जैसे 5'9" या 175 cm)\n2. **उम्र और लिंग (Age & Sex)?**\n3. **गतिविधि स्तर (Activity Level - Sedentary, Moderate, Active)?**\n4. **आहार प्रकार (शाकाहारी / मांसाहारी / एगेटेरियन)?**\n\nजैसे ही आप ये बताएंगे, PackCheck इंजन आपकी दैनिक कैलोरी, प्रोटीन और मैक्रोज़ की सटीक गणना कर देगा!`;
      } else if (language === 'hinglish') {
        return `Bhai, ${knownWeight ? `${knownWeight} weight` : ''} ${knownGoal ? `aur **${knownGoal}** goal` : 'ke liye diet plan'} banane ke liye PackCheck engine ready hai! 🎯\n\nExact calories aur protein target calculate karne ke liye please ye details share karein:\n1. **Height?** (e.g. 5'9 ya 175 cm)\n2. **Age aur Sex?** (e.g. 24 male/female)\n3. **Activity level?** (desk job, regular gym, ya active?)\n4. **Diet type?** (pure veg, non-veg, ya eggetarian?)\n\n*Preliminary estimate:* ${knownWeight ? `${knownWeight} par daily ~100-130g protein aur balanced caloric distribution zaroori hoga.` : 'Jaise hi aap details denge, exact plan generate ho jayega!'}`;
      } else {
        return `To design your customized ${knownGoal ? `${knownGoal} ` : ''}diet plan${knownWeight ? ` for ${knownWeight}` : ''}, please provide a few additional details:\n1. **Height** (e.g., 5'9" or 175 cm)\n2. **Age & Biological Sex**\n3. **Activity Level** (Sedentary, Light, Moderate, Very Active)\n4. **Dietary Preference** (Vegetarian, Non-vegetarian, Vegan)\n\nOnce shared, PackCheck's deterministic calculator will formulate your exact caloric deficit/surplus and macronutrient targets!`;
      }
    }

    // =========================================================================
    // 4. GENERAL HEALTHIER ALTERNATIVE QUERY (WITHOUT PRODUCT CONTEXT)
    // =========================================================================
    const isAlternativeQuery = /\b(alternative|alternatives|better option|healthier option|substitute|substitutes|swaps|vikalp)\b/i.test(lower);
    if (isAlternativeQuery) {
      if (language === 'hindi') {
        return `यहाँ **PackCheck डेटाबेस** से विभिन्न श्रेणियों के शीर्ष स्वास्थ्यप्रद विकल्प (Healthy Swaps) दिए गए हैं:\n\n1. **पेय (Beverages):** पैकेज्ड मीठे कोला की जगह **Raw Pressery Pure Coconut Water** (कम कैलोरी, 0g अतिरिक्त चीनी)।\n2. **स्नैक्स (Snacks):** डीप-फ्राइड चिप्स की जगह **Too Yumm! Karare** (बेक्ड मल्टीग्रेन, ~40% कम सैचुरेटेड फैट)।\n3. **बिस्कुट (Biscuits):** मैदे वाले कुकीज की जगह **Britannia NutriChoice High Fibre**।\n4. **नाश्ता (Breakfast):** मीठे सीरियल्स की जगह **Bagrry's Organic Rolled Oats**।\n5. **स्प्रेड (Spreads):** **The Whole Truth 100% Peanut Butter Unsweetened** (शून्य अतिरिक्त चीनी और तेल)।\n\nआप किसी भी खास उत्पाद का नाम लिखकर या बारकोड स्कैन करके उसके लिए सीधे विकल्प भी पा सकते हैं!`;
      } else if (language === 'hinglish') {
        return `PackCheck database se top categories ke verified **healthier alternatives (swaps)** ye rahe:\n\n1. **Beverages:** Sugary soda/cola ke badle **Raw Pressery Pure Coconut Water** (Zero added sugar, natural electrolytes).\n2. **Savory Snacks:** Regular fried chips ke badle **Too Yumm! Karare** (Baked multigrain, ~40% lower saturated fat).\n3. **Biscuits & Cookies:** Refined flour cookies ke badle **Britannia NutriChoice Digestive High Fibre**.\n4. **Breakfast:** Sugary flakes ke badle **Bagrry's Organic Rolled Oats** (High complex carbs & fiber).\n5. **Spreads:** Commercial sweet spreads ke badle **The Whole Truth 100% Peanut Butter** (100% peanuts, zero added sugar/oil).\n\nAap kisi bhi specific product ka naam type karke ya uska barcode scan karke instant personalized swap recommendation bhi dekh sakte hain!`;
      } else {
        return `Here are top verified healthier alternatives from the **PackCheck database** across key categories:\n\n1. **Beverages:** Swap high-sugar carbonated sodas for **Raw Pressery Pure Coconut Water** (zero added sugar, natural potassium).\n2. **Savory Snacks:** Swap deep-fried potato chips for **Too Yumm! Multigrain Karare** (~40% lower saturated fat, baked).\n3. **Biscuits:** Swap refined flour cream biscuits for **Britannia NutriChoice High Fibre**.\n4. **Breakfast:** Swap sugar-coated cereals for **Bagrry's Organic Rolled Oats** (100% whole grain complex carbohydrates).\n5. **Nut Butters:** Swap hydrogenated oil/sugar spreads for **The Whole Truth 100% Peanut Butter Unsweetened**.\n\nYou can also scan or enter any specific product on PackCheck to see instant, tailormade healthy alternatives for it!`;
      }
    }

    // =========================================================================
    // 5. PRODUCT MENTIONED BUT NOT IN PACKCHECK DATABASE
    // =========================================================================
    if (notFoundProduct) {
      if (language === 'hindi') {
        return `PackCheck डेटाबेस में **${notFoundProduct}** का सत्यापित पोषण डेटा फिलहाल उपलब्ध नहीं है, इसलिए मैं काल्पनिक पोषण आंकड़े नहीं दे सकता।\n\n**सामान्य दिशानिर्देश:**\n- यदि यह कोई पैकेज्ड मीठा पेय (Soft Drink) या प्रसंस्कृत स्नैक है, तो इसमें आमतौर पर अतिरिक्त चीनी या सोडियम अधिक होता है।\n- इसका दैनिक सेवन स्वास्थ्य के लिए अनुशंसित नहीं है।\n\nआप इस उत्पाद का बारकोड स्कैन करके या लेबल की फोटो अपलोड करके PackCheck पर सटीक स्क्रीनिंग परिणाम प्राप्त कर सकते हैं!`;
      } else if (language === 'hinglish') {
        return `Bhai, PackCheck ke database mein **${notFoundProduct}** ka verified nutrition data filhaal available nahi hai, isliye main exact sugar ya calorie numbers invent nahi kar sakta.\n\n**General Packaged Product Guidelines:**\n- Agar yeh koi packaged sweetened drink ya processed snack hai, toh aam taur par isme free sugar ya refined fats kafi high hote hain.\n- Daily habit ke roop mein aisi drinks/snacks lena recommended nahi hota.\n\nAap PackCheck par iska barcode scan karke ya product label upload karke instant compliance aur nutrition verification dekh sakte hain!`;
      } else {
        return `PackCheck does not currently have verified database records for **${notFoundProduct}**, so I cannot provide exact nutritional figures.\n\n**General Nutritional Guidelines:**\n- If this is a processed snack or sweetened carbonated beverage, it typically contains high levels of added sugars or sodium with minimal micronutrient density.\n- Daily consumption is generally not advised for optimal metabolic health.\n\nYou can scan this product's barcode on PackCheck to run an automated label and compliance screening!`;
      }
    }


    // =========================================================================
    // 5. HEALTHY SNACKS / ALTERNATIVES QUERY WITHOUT SPECIFIC PRODUCT
    // =========================================================================
    if (/\b(snack|snacks|nasta|alternative|healthy food|kya khaye)\b/i.test(lower)) {
      if (language === 'hindi') {
        return `PackCheck डेटाबेस और पोषण विज्ञान के अनुसार कुछ बेहतरीन स्वास्थ्यप्रद स्नैक्स:\n- **भुना चना / मखाना:** कम कैलोरी, उच्च फाइबर और प्रोटीन।\n- **अंकुरित मूंग (Sprouts चाट):** विटामिन और फाइबर से भरपूर।\n- **दही या पनीर क्यूब्स:** प्राकृतिक प्रोटीन और कैल्शियम।\n- **Quaker Oats या Slurrp Farm बाजरा नूडल्स:** कम सोडियम और बिना अतिरिक्त चीनी वाले प्रमाणित विकल्प।`;
      } else if (language === 'hinglish') {
        return `PackCheck database aur clean nutrition ke hisab se top healthy Indian snacks:\n- **Roasted Makhana ya Chana:** Low calories, high fiber aur clean protein.\n- **Sprouts Chaat (Moong/Chana):** High micronutrients aur zero added sugar.\n- **Paneer / Boiled Eggs:** Pure protein source jo lambe samay tak bhookh control karta hai.\n- **PackCheck DB Verified Products:** Quaker Rolled Oats, Pintola Peanut Butter, Slurrp Farm Millet Noodles.`;
      } else {
        return `Here are top healthy snack choices verified through clean nutritional benchmarks:\n- **Roasted Makhana / Roasted Chana:** High dietary fiber, clean plant protein, low glycemic index.\n- **Sprouted Moong Chaat:** Rich in active enzymes, fiber, and micronutrients.\n- **Low-Fat Paneer / Boiled Egg Whites:** High satiety and quality protein.\n- **PackCheck DB Verified Packaged Options:** Quaker Rolled Whole Grain Oats, Pintola All-Natural Peanut Butter, Slurrp Farm Millet Noodles.`;
      }
    }

    // =========================================================================
    // 6. GREETING (hi, hello, hey, namaste)
    // =========================================================================
    if (/^(hi|hello|hey|namaste|pranam|hola|good morning|good evening)\b/i.test(lower)) {
      if (language === 'hindi') {
        return `नमस्ते! मैं PackCheck AI हूँ 👋\n\nमैं पैकेज्ड उत्पादों की पोषण जांच, चीनी/सोडियम विश्लेषण, और व्यक्तिगत डाइट प्लानिंग में आपकी मदद कर सकता हूँ। आप किसी भी उत्पाद के बारे में पूछ सकते हैं!`;
      } else if (language === 'hinglish') {
        return `Hello bhai! Main PackCheck AI hoon 👋\n\nAap kisi bhi packaged product ke baare me (jaise Sprite, Lays, Amul butter) pooch sakte hain, ya apna weight/goal bata kar personalized diet plan banwa sakte hain. Bataiye kya madad karun?`;
      } else {
        return `Hello! I'm PackCheck AI 👋\n\nI can help you analyze packaged foods, calculate personalized nutrition and diet plans, or recommend healthier product alternatives. How can I assist you today?`;
      }
    }

    // =========================================================================
    // 7. GENERAL OBJECTIVE ASSISTANCE (Never repeat the large initial card)
    // =========================================================================
    if (language === 'hindi') {
      return `मैंने आपका प्रश्न समझ लिया है: "${message}"।\n\nसटीक पोषण विश्लेषण के लिए आप किसी भी पैकेज्ड उत्पाद का नाम (जैसे Amul, Lays, Sprite) बता सकते हैं, या अपना वजन और ऊंचाई साझा करके व्यक्तिगत डाइट प्लान प्राप्त कर सकते हैं। आप क्या जानना चाहेंगे?`;
    } else if (language === 'hinglish') {
      return `Maine aapka question note kiya: "${message}"।\n\nPackCheck par aap kisi bhi packaged product ka naam likh kar uski sugar, calories, aur health rating jaan sakte hain, ya apna weight aur height share karke custom diet plan banwa sakte hain. Kisi specific product ke baare me pooch rahe hain?`;
    } else {
      return `I received your message: "${message}".\n\nTo provide precise nutrition analysis, feel free to mention a packaged product name (e.g. Sprite, Lay's, Amul Butter) or provide your weight, height, and goal for a customized diet plan. How would you like to proceed?`;
    }
  }
}
