import { Request, Response } from 'express';
import { AIService, ChatMessage } from '../services/ai.service';
import { NutritionCalculatorService, UserNutritionProfile } from '../services/nutritionCalculator.service';

export class AIController {
  /**
   * Main AI Chat endpoint
   * POST /api/ai/chat
   */
  public static async chat(req: Request, res: Response) {
    try {
      const { message, conversation, productId, language, userProfile } = req.body;

      // 1. Validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Message is required and cannot be empty.' }
        });
      }

      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 2500) {
        return res.status(400).json({
          success: false,
          error: { message: 'Message length exceeds maximum allowable limit of 2500 characters.' }
        });
      }

      // 2. Validate and cap conversation history
      const sanitizedConversation: ChatMessage[] = [];
      if (Array.isArray(conversation)) {
        for (const item of conversation.slice(-15)) {
          if (item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string') {
            sanitizedConversation.push({
              role: item.role,
              content: item.content.slice(0, 3000)
            });
          }
        }
      }

      // 3. Optional productId validation
      const sanitizedProductId = typeof productId === 'string' && productId.trim().length > 0
        ? productId.trim()
        : undefined;

      // 4. Invoke AI Service
      const result = await AIService.chat({
        message: trimmedMessage,
        conversation: sanitizedConversation,
        productId: sanitizedProductId,
        language: typeof language === 'string' ? language : 'auto',
        userProfile: typeof userProfile === 'object' ? (userProfile as UserNutritionProfile) : undefined
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[AIController] Unhandled error during chat:', error?.message || error);
      return res.status(500).json({
        success: false,
        error: { message: 'Sorry, PackCheck AI encountered a temporary issue. Please try again.' }
      });
    }
  }

  /**
   * Deterministic nutrition target calculation endpoint
   * POST /api/ai/calculate-nutrition
   */
  public static async calculateNutrition(req: Request, res: Response) {
    try {
      const profile: UserNutritionProfile = req.body;
      const result = NutritionCalculatorService.calculate(profile);
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[AIController] Error calculating nutrition:', error?.message || error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to calculate nutrition targets.' }
      });
    }
  }

  /**
   * Quick context summary endpoint for current product
   * GET /api/ai/context/:productId
   */
  public static async getProductContext(req: Request, res: Response) {
    try {
      const productId = String(req.params.productId);
      const context = await AIService.resolveProductContext(productId);
      if (!context) {
        return res.status(404).json({
          success: false,
          error: { message: 'Product context could not be loaded.' }
        });
      }
      return res.json({
        success: true,
        data: context
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: 'Error retrieving product context.' }
      });
    }
  }
}
