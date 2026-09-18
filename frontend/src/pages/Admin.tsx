import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Settings,
  ShieldAlert,
  Layers,
  Database,
  Globe,
  Plus,
  CheckCircle,
  Activity,
  AlertTriangle
} from 'lucide-react';

export const Admin: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: 'Chips',
    price: 20,
    packSize: '50g',
    fssaiNumber: '10014064000435',
    ingredientText: 'Sample packaging ingredients text.',
    calories: 450,
    protein: 8,
    sugar: 4,
    sodium: 400
  });
  const [createSuccess, setCreateSuccess] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([api.getAdminStats(), api.getRules()]);
      setStats(s);
      setRules(r);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        price: Number(newProduct.price),
        packSize: newProduct.packSize,
        fssaiNumber: newProduct.fssaiNumber,
        ingredient: { ingredientText: newProduct.ingredientText, allergens: [] },
        nutrition: {
          servingSize: '100g',
          calories: Number(newProduct.calories),
          protein: Number(newProduct.protein),
          sugar: Number(newProduct.sugar),
          sodium: Number(newProduct.sodium)
        }
      });
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowAddModal(false);
        loadAdminData();
      }, 1500);
    } catch (err) {
      alert('Error creating product: ' + err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-soft-orange text-brand-primary-orange flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
              Admin & System Operations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-secondary-text mt-0.5">
            Overview of compliance rule engine, external provider links, and database integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 bg-brand-primary-orange hover:bg-brand-hover-orange text-white text-xs font-bold px-4 py-2 rounded-xl shadow-soft transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-soft space-y-1">
            <div className="flex items-center justify-between text-brand-secondary-text">
              <span className="text-xs font-semibold">Total Verified Products</span>
              <Layers className="w-4 h-4 text-brand-primary-orange" />
            </div>
            <span className="font-heading text-3xl font-black text-brand-dark-text block">
              {stats.totalProducts}
            </span>
            <span className="text-[10px] text-brand-secondary-text">Active catalog entries</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-soft space-y-1">
            <div className="flex items-center justify-between text-brand-secondary-text">
              <span className="text-xs font-semibold">Compliance Rules</span>
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="font-heading text-3xl font-black text-emerald-700 block">
              {stats.totalRules}
            </span>
            <span className="text-[10px] text-brand-secondary-text">FSSAI/ICMR deterministic rules</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-soft space-y-1">
            <div className="flex items-center justify-between text-brand-secondary-text">
              <span className="text-xs font-semibold">Database Persistence</span>
              <Database className="w-4 h-4 text-brand-primary-orange" />
            </div>
            <span className="font-heading text-sm font-bold text-brand-dark-text block truncate mt-2">
              {stats.databaseStatus}
            </span>
            <span className="text-[10px] text-brand-secondary-text">Prisma ORM Layer</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-soft space-y-1">
            <div className="flex items-center justify-between text-brand-secondary-text">
              <span className="text-xs font-semibold">External Food API</span>
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-heading text-sm font-bold text-emerald-700 block mt-2">
              {stats.externalProvider?.status || 'Online'}
            </span>
            <span className="text-[10px] text-brand-secondary-text">{stats.externalProvider?.name}</span>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-brand-dark-text">Configured Scoring & Warning Rules</h3>
            <p className="text-xs text-brand-secondary-text">Deterministic thresholds stored in database</p>
          </div>
          <span className="text-xs font-mono font-bold bg-brand-soft-orange px-2.5 py-1 rounded-xl text-brand-primary-orange border border-brand-light-orange">
            {rules.length} Rules Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-[#FAF6F0]">
                <th className="p-3 font-heading font-bold text-brand-secondary-text">Field</th>
                <th className="p-3 font-heading font-bold text-brand-secondary-text">Condition</th>
                <th className="p-3 font-heading font-bold text-brand-secondary-text">Threshold</th>
                <th className="p-3 font-heading font-bold text-brand-secondary-text">Severity</th>
                <th className="p-3 font-heading font-bold text-brand-secondary-text">Message</th>
                <th className="p-3 font-heading font-bold text-brand-secondary-text">Authority Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-[#FFFDFB]">
                  <td className="p-3 font-mono font-bold text-brand-dark-text">{r.field}</td>
                  <td className="p-3 font-mono text-brand-secondary-text">{r.operator}</td>
                  <td className="p-3 font-mono font-extrabold">{r.threshold}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.severity === 'POSITIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="p-3 text-brand-dark-text max-w-sm">{r.message}</td>
                  <td className="p-3 text-brand-secondary-text">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-brand-border max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-brand-dark-text">Add Product Entry</h3>
            {createSuccess ? (
              <div className="p-6 text-center text-emerald-700 space-y-2">
                <CheckCircle className="w-10 h-10 mx-auto" />
                <p className="font-bold">Product created and verified successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Multigrain Crackers"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full p-2 rounded-xl border border-brand-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Brand</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nature Organics"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full p-2 rounded-xl border border-brand-border"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full p-2 rounded-xl border border-brand-border"
                    >
                      <option>Chips</option>
                      <option>Biscuits</option>
                      <option>Peanut Butter</option>
                      <option>Cereal</option>
                      <option>Milk</option>
                      <option>Juice</option>
                      <option>Instant Noodles</option>
                      <option>Protein Products</option>
                      <option>Snacks</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-brand-border"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">14-digit FSSAI License</label>
                    <input
                      type="text"
                      value={newProduct.fssaiNumber}
                      onChange={(e) => setNewProduct({ ...newProduct, fssaiNumber: e.target.value })}
                      className="w-full p-2 rounded-xl border border-brand-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-1">
                  <div>
                    <label className="font-bold block text-[10px]">Calories</label>
                    <input
                      type="number"
                      value={newProduct.calories}
                      onChange={(e) => setNewProduct({ ...newProduct, calories: parseFloat(e.target.value) })}
                      className="w-full p-1.5 rounded-lg border border-brand-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-[10px]">Protein (g)</label>
                    <input
                      type="number"
                      value={newProduct.protein}
                      onChange={(e) => setNewProduct({ ...newProduct, protein: parseFloat(e.target.value) })}
                      className="w-full p-1.5 rounded-lg border border-brand-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-[10px]">Sugar (g)</label>
                    <input
                      type="number"
                      value={newProduct.sugar}
                      onChange={(e) => setNewProduct({ ...newProduct, sugar: parseFloat(e.target.value) })}
                      className="w-full p-1.5 rounded-lg border border-brand-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold block text-[10px]">Sodium (mg)</label>
                    <input
                      type="number"
                      value={newProduct.sodium}
                      onChange={(e) => setNewProduct({ ...newProduct, sodium: parseFloat(e.target.value) })}
                      className="w-full p-1.5 rounded-lg border border-brand-border text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-brand-border rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-primary-orange text-white font-bold rounded-xl"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
