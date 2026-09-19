import { describe, it, expect } from 'vitest';
import { AIService } from '../src/services/ai.service';
import { dbService } from '../src/services/db.service';

describe('AIService', () => {
  it('should detect languages accurately (English, Hindi, Hinglish)', () => {
    expect(AIService.detectLanguage('Is this product good for health?')).toBe('english');
    expect(AIService.detectLanguage('क्या यह उत्पाद स्वास्थ्य के लिए सुरक्षित है?')).toBe('hindi');
    expect(AIService.detectLanguage('Bhai ye product daily khana safe hai kya?')).toBe('hinglish');
    expect(AIService.detectLanguage('Mujhe high protein diet plan chahiye')).toBe('hinglish');
  });

  it('should resolve product context from internal seed database', async () => {
    // Seed product 'prod-seed-1' is Lays Classic Salted
    const context = await AIService.resolveProductContext('prod-seed-1');
    expect(context).not.toBeNull();
    expect(context?.name).toContain('Lays');
    expect(context?.brand).toBe('Lays');
    expect(context?.nutrition?.calories).toBeDefined();
    expect(context?.healthScore).toBeDefined();
    expect(context?.legalMetrology).toBeDefined();
    expect(context?.recommendations).toBeDefined();
  }, 15000);

  it('should generate intelligent deterministic response with product context', async () => {
    const productContext = await AIService.resolveProductContext('prod-seed-1');
    expect(productContext).not.toBeNull();

    // Sugar question in Hinglish
    const replyHinglish = AIService.generateDeterministicResponse({
      message: 'Isme sugar kitna hai?',
      language: 'hinglish',
      productContext: productContext!
    });
    expect(replyHinglish).toContain('Lays');
    expect(replyHinglish.toLowerCase()).toContain('sugar');

    // Alternatives question in English
    const replyAlt = AIService.generateDeterministicResponse({
      message: 'Suggest a healthier alternative',
      language: 'english',
      productContext: productContext!
    });
    expect(replyAlt).toContain('PackCheck');

    // Legal Metrology question
    const replyLegal = AIService.generateDeterministicResponse({
      message: 'Explain compliance and rules',
      language: 'english',
      productContext: productContext!
    });
    expect(replyLegal).toContain('Legal Metrology');
  }, 15000);

  it('should execute AIService.chat seamlessly in offline/fallback mode', async () => {
    const res = await AIService.chat({
      message: "My weight is 70 kg and height is 5'9. I want to build muscle. Give me a full day diet plan.",
      productId: 'prod-seed-1'
    });

    expect(res.message).toBeDefined();
    expect(res.message.length).toBeGreaterThan(50);
    expect(res.productContextUsed).toBe(true);
    expect(res.productSummary?.name).toContain('Lays');
    expect(res.nutritionTargets).toBeDefined();
    expect(res.nutritionTargets?.targetCalories).toBeGreaterThan(1500);
  }, 15000);
});
