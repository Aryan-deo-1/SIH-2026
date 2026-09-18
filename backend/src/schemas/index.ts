import { z } from 'zod';

export const BarcodeLookupSchema = z.object({
  barcode: z.string().min(3, 'Barcode must be at least 3 characters')
});

export const ManualSearchSchema = z.object({
  query: z.string().optional().default(''),
  category: z.string().optional().default('ALL')
});

export const DietSearchSchema = z.object({
  category: z.string().optional(),
  minProtein: z.number().optional(),
  maxSugar: z.number().optional(),
  maxSodium: z.number().optional(),
  minFiber: z.number().optional(),
  maxCalories: z.number().optional(),
  maxFat: z.number().optional(),
  budget: z.number().optional(),
  sortBy: z.enum(['score', 'protein', 'price_asc', 'calories_asc']).optional()
});

export const CompareSchema = z.object({
  productIds: z.array(z.string()).min(2, 'At least 2 products are required for comparison').max(4, 'Maximum 4 products can be compared simultaneously')
});

export const CreateProductSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  category: z.string().min(1),
  manufacturer: z.string().optional(),
  barcodeGtIN: z.string().optional(),
  packSize: z.string().optional(),
  price: z.number().optional(),
  imageUrl: z.string().optional(),
  nutrition: z.object({
    servingSize: z.string().optional(),
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbohydrates: z.number().optional(),
    sugar: z.number().optional(),
    addedSugar: z.number().optional(),
    fat: z.number().optional(),
    saturatedFat: z.number().optional(),
    transFat: z.number().optional(),
    fiber: z.number().optional(),
    sodium: z.number().optional()
  }).optional(),
  ingredient: z.object({
    ingredientText: z.string(),
    allergens: z.array(z.string()).optional()
  }).optional(),
  fssaiNumber: z.string().optional()
});
