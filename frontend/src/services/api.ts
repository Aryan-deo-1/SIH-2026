import axios from 'axios';
import {
  ScanResultPayload,
  StandardProduct,
  DietFilterParams,
  DietFinderResult,
  ComparisonReport,
  ScanHistoryItem
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // 1. Scan / Upload / OCR
  scan: async (formData: FormData): Promise<ScanResultPayload> => {
    const res = await apiClient.post('/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },

  // 2. Barcode lookup
  lookupBarcode: async (barcode: string): Promise<ScanResultPayload> => {
    const res = await apiClient.post('/barcode/lookup', { barcode });
    return res.data.data;
  },

  // 3. Product details
  getProduct: async (id: string): Promise<ScanResultPayload> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data.data;
  },

  // 4. Products list
  getProducts: async (category?: string, search?: string): Promise<StandardProduct[]> => {
    const params: any = {};
    if (category && category !== 'ALL') params.category = category;
    if (search) params.search = search;
    const res = await apiClient.get('/products', { params });
    return res.data.data;
  },

  // 5. Manual Search with External Fallback
  searchManual: async (query: string, category: string = 'ALL') => {
    const res = await apiClient.post('/search/manual', { query, category });
    return res.data;
  },

  // 5b. Unified Search Products GET endpoint
  searchProducts: async (q: string, category?: string) => {
    const params: any = { q };
    if (category && category !== 'ALL') params.category = category;
    const res = await apiClient.get('/products/search', { params });
    return res.data;
  },

  // 6. Diet Finder Search
  searchDiet: async (params: DietFilterParams): Promise<DietFinderResult[]> => {
    const res = await apiClient.post('/search/diet', params);
    return res.data.data;
  },

  // 7. Product Comparison
  compare: async (productIds: string[]): Promise<ComparisonReport> => {
    const res = await apiClient.post('/compare', { productIds });
    return res.data.data;
  },

  // 8. History
  getHistory: async (): Promise<ScanHistoryItem[]> => {
    const res = await apiClient.get('/history');
    return res.data.data;
  },

  clearHistory: async (): Promise<void> => {
    await apiClient.delete('/history');
  },

  // 9. Admin
  getAdminStats: async () => {
    const res = await apiClient.get('/admin/stats');
    return res.data.data;
  },

  createProduct: async (productData: any): Promise<StandardProduct> => {
    const res = await apiClient.post('/admin/products', productData);
    return res.data.data;
  },

  getRules: async () => {
    const res = await apiClient.get('/admin/rules');
    return res.data.data;
  },

  // 10. Legal Metrology Compliance (Rules 2011)
  checkCompliance: async (productData: any) => {
    const res = await apiClient.post('/compliance/check', { productData });
    return res.data.data;
  },

  getLegalMetrologyRules: async () => {
    const res = await apiClient.get('/compliance/rules');
    return res.data.data;
  },

  getComplianceResult: async (id: string) => {
    const res = await apiClient.get(`/compliance/results/${id}`);
    return res.data.data;
  },

  // 11. PackCheck AI Assistant
  aiChat: async (payload: {
    message: string;
    conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
    productId?: string;
    language?: string;
    userProfile?: any;
  }) => {
    const res = await apiClient.post('/ai/chat', payload);
    return res.data;
  },

  getAIProductContext: async (productId: string) => {
    const res = await apiClient.get(`/ai/context/${productId}`);
    return res.data;
  },

  calculateNutrition: async (profile: any) => {
    const res = await apiClient.post('/ai/calculate-nutrition', profile);
    return res.data;
  }
};

