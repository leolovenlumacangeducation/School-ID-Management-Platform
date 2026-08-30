import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  X,
  ExternalLink,
  Plus,
  Eye,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Asset } from '../../types';

interface AssetLibraryViewProps {
  activeSchoolId: string;
}

export const AssetLibraryView: React.FC<AssetLibraryViewProps> = ({ activeSchoolId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    type: 'LOGO',
    name: '',
    url: '',
    tags: ['branding'],
  });

  useEffect(() => {
    loadAssets();
  }, [activeSchoolId]);

  const loadAssets = () => {
    setAssets(storage.getAssets(activeSchoolId));
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete asset "${name}"?`)) {
      storage.deleteAsset(id);
      loadAssets();
    }
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.url) return;

    const toSave: Asset = {
      id: `ast-${Date.now()}`,
      schoolId: activeSchoolId !== 'all' ? activeSchoolId : 'sch-1',
      name: newAsset.name,
      category: ((newAsset as any).category || (newAsset as any).type || 'LOGOS') as any,
      url: newAsset.url,
      fileSize: 452000,
      fileType: 'image/png',
      tags: typeof newAsset.tags === 'string' ? (newAsset.tags as string).split(',').map(t => t.trim()) : (newAsset.tags || ['branding']),
      createdAt: new Date().toISOString(),
    };

    storage.saveAsset(toSave);
    loadAssets();
    setIsUploadModalOpen(false);
    setNewAsset({ name: '', url: '', tags: ['branding'], category: 'LOGOS' } as any);
  };

  const filteredAssets = assets.filter(a => {
    const assetCat = (a as any).category || (a as any).type || 'LOGOS';
    const matchesType = typeFilter === 'ALL' || assetCat.toUpperCase().includes(typeFilter.toUpperCase());
    const matchesSearch = `${a.name || ''} ${(a.tags || []).join(' ')}`.toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Digital Asset & Media Library</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Store high-resolution official school seals, logos, authorized signatures, security holograms, and background artwork.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Media Asset</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset name, file tag, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          {['ALL', 'LOGO', 'SIGNATURE', 'SEAL', 'BACKGROUND', 'BADGE'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === type
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Assets' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredAssets.map(asset => (
          <div
            key={asset.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
          >
            {/* Image Preview Stage */}
            <div className="w-full h-44 bg-slate-100 dark:bg-slate-950/80 p-4 flex items-center justify-center relative canvas-checkerboard overflow-hidden">
              <img
                src={asset.url}
                alt={asset.name}
                className="max-h-full max-w-full object-contain rounded-xl transition-transform group-hover:scale-105"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-black/60 text-white backdrop-blur-xs">
                  {(asset as any).category || (asset as any).type || 'ASSET'}
                </span>
              </div>
            </div>

            {/* Info and Tags */}
            <div className="p-4 space-y-2">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={asset.name}>
                {asset.name}
              </h3>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => handleCopyUrl(asset.url, asset.id)}
                className="text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1 text-[11px]"
              >
                {copiedId === asset.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPreviewAsset(asset)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Preview asset"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(asset.id, asset.name)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                  title="Delete asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Asset Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Upload New Asset
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={newAsset.name || ''}
                  onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="e.g. Official DepEd Gold Seal"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Asset Category</label>
                <select
                  value={newAsset.type || 'LOGO'}
                  onChange={e => setNewAsset({ ...newAsset, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="LOGO">School Logo</option>
                  <option value="SEAL">Official Seal</option>
                  <option value="SIGNATURE">Authorized Signature</option>
                  <option value="BACKGROUND">Card Background Texture</option>
                  <option value="BADGE">Verification Badge</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Image Asset URL *</label>
                <input
                  type="url"
                  required
                  value={newAsset.url || ''}
                  onChange={e => setNewAsset({ ...newAsset, url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Asset Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{previewAsset.name}</h3>
              <button onClick={() => setPreviewAsset(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-64 bg-slate-100 dark:bg-slate-950 rounded-2xl p-4 flex items-center justify-center canvas-checkerboard">
              <img src={previewAsset.url} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewAsset(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
