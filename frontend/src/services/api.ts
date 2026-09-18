import axios from 'axios';
import {
  ScanResultPayload,
  StandardProduct,
  DietFilterParams,
  DietFinderResult,
  ComparisonReport,
  ScanHistoryItem
} from '../types';

const API_BASE_URL = '/api';

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
  }
};
