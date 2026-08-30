import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Plus,
  Sparkles,
  Copy,
  CheckCircle,
  Star,
  Trash2,
  Edit,
  ArrowRight,
  Eye,
  Sliders,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { IdTemplate } from '../../types';

interface TemplatesViewProps {
  activeSchoolId: string;
  onOpenDesigner: (templateId?: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ activeSchoolId, onOpenDesigner }) => {
  const [templates, setTemplates] = useState<IdTemplate[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    loadTemplates();
  }, [activeSchoolId]);

  const loadTemplates = () => {
    setTemplates(storage.getTemplates(activeSchoolId));
  };

  const handleDuplicate = (template: IdTemplate) => {
    const duplicated: IdTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      version: 1,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveTemplate(duplicated);
    loadTemplates();
  };

  const handleSetDefault = (template: IdTemplate) => {
    // Unset current default of same type
    templates.forEach(t => {
      if (t.type === template.type && t.isDefault && t.id !== template.id) {
        storage.saveTemplate({ ...t, isDefault: false });
      }
    });
    storage.saveTemplate({ ...template, isDefault: true });
    loadTemplates();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete template "${name}"?`)) {
      storage.deleteTemplate(id);
      loadTemplates();
    }
  };

  const filteredTemplates = templates.filter(t => {
    return typeFilter === 'ALL' || t.type === typeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>ID Card Templates & Layouts</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized CR80 plastic card specifications, variable bindings, and front/back artwork.
          </p>
        </div>

        <button
          onClick={() => onOpenDesigner()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/30 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch ID Designer Studio</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        {['ALL', 'STUDENT_ID', 'TEACHER_ID', 'VISITOR_PASS', 'RFID_SMART_CARD'].map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
              typeFilter === type
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {type === 'ALL' ? 'All Templates' : (type || '').replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(tpl => {
          const isLandscape = tpl.orientation === 'LANDSCAPE';

          return (
            <div
              key={tpl.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div className="p-6 space-y-4">
                {/* Header & Badges */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {(tpl.type || '').replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">
                        v{tpl.version}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {tpl.name}
                    </h3>
                  </div>

                  {tpl.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Default
                    </span>
                  )}
                </div>

                {/* Card Canvas Visualizer Thumbnail */}
                <div
                  onClick={() => onOpenDesigner(tpl.id)}
                  className="w-full h-44 rounded-2xl bg-slate-100 dark:bg-slate-950/80 p-3 flex items-center justify-center relative cursor-pointer overflow-hidden border border-slate-200/80 dark:border-slate-800 group-hover:border-indigo-500 transition-all"
                >
                  <div
                    className={`rounded-xl shadow-md transition-transform group-hover:scale-105 border border-[#2D3038] overflow-hidden flex flex-col justify-between p-3 ${
                      isLandscape ? 'w-56 h-36' : 'w-36 h-48'
                    }`}
                    style={{
                      background: tpl.frontData?.backgroundColor || tpl.frontData?.elements?.[0]?.fill || '#15171E',
                    }}
                  >
                    {/* Header line simulation */}
                    <div className="space-y-1">
                      <div className="h-2 w-16 bg-slate-400/80 rounded-sm"></div>
                      <div className="h-1.5 w-24 bg-slate-500/60 rounded-sm"></div>
                    </div>

                    {/* Middle photo simulation */}
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-10 rounded-md bg-slate-700 ring-1 ring-white/20"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-2 w-full bg-slate-400/70 rounded-xs"></div>
                        <div className="h-1.5 w-3/4 bg-slate-500/50 rounded-xs"></div>
                        <div className="h-1.5 w-1/2 bg-slate-500/40 rounded-xs"></div>
                      </div>
                    </div>

                    {/* QR block simulation */}
                    <div className="flex justify-between items-end">
                      <div className="h-1.5 w-12 bg-slate-500/40 rounded-xs"></div>
                      <div className="w-6 h-6 rounded-xs bg-[#1F2128] border border-[#2D3038] flex items-center justify-center text-[7px] text-indigo-300 font-mono">
                        QR
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 backdrop-blur-2xs transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Open in Designer Studio</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1 font-mono">
                  <span>
                    {tpl.orientation} • {tpl.widthMm || 85.6} x {tpl.heightMm || 53.98} mm (CR80)
                  </span>
                  <span>{(tpl.frontData?.elements || []).length} front / {(tpl.backData?.elements || []).length} back items</span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Duplicate template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {!tpl.isDefault && (
                    <button
                      onClick={() => handleSetDefault(tpl)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Set as school default"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(tpl.id, tpl.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onOpenDesigner(tpl.id)}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Edit in Canvas</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
