import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  Download,
  RotateCw,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Layers,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  QrCode,
  Barcode,
  LayoutTemplate,
  Trash2,
  Copy,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Grid,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Sliders,
  Palette,
  Minus,
  Move,
  Tag,
  Shield,
  FileCode,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { CardRenderer } from '../../services/cardRenderer';
import { IdTemplate, CanvasElement, School, Student, Teacher } from '../../types';

interface IdDesignerProps {
  initialTemplateId?: string;
  activeSchoolId: string;
  onBack: () => void;
}

export const IdDesigner: React.FC<IdDesignerProps> = ({
  initialTemplateId,
  activeSchoolId,
  onBack,
}) => {
  const [template, setTemplate] = useState<IdTemplate | null>(null);
  const [activeSide, setActiveSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [livePreview, setLivePreview] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'text' | 'elements' | 'photo' | 'qr' | 'variables' | 'layers'>('text');
  const [history, setHistory] = useState<IdTemplate[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);

  // Sample data for live preview
  const schools = storage.getSchools();
  const currentSchool = schools.find(s => s.id === activeSchoolId) || schools[0];
  const sampleStudents = storage.getStudents(activeSchoolId);
  const sampleTeachers = storage.getTeachers(activeSchoolId);
  const sampleRecord = template?.type === 'TEACHER_ID' ? sampleTeachers[0] : sampleStudents[0];

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize template
  useEffect(() => {
    const templates = storage.getTemplates(activeSchoolId);
    let target = initialTemplateId ? templates.find(t => t.id === initialTemplateId) : null;
    if (!target) {
      target = templates[0] || {
        id: `tpl-${Date.now()}`,
        schoolId: activeSchoolId !== 'all' ? activeSchoolId : 'sch-1',
        name: 'Modern DepEd Card Standard',
        type: 'STUDENT_ID',
        orientation: 'LANDSCAPE',
        widthMm: 85.6,
        heightMm: 53.98,
        isDefault: false,
        status: 'ACTIVE',
        version: 1,
        frontData: {
          backgroundColor: '#ffffff',
          elements: [],
        },
        backData: {
          backgroundColor: '#ffffff',
          elements: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    setTemplate(JSON.parse(JSON.stringify(target)));
    setHistory([JSON.parse(JSON.stringify(target))]);
    setHistoryIndex(0);
  }, [initialTemplateId, activeSchoolId]);

  // Render canvas whenever template, activeSide, zoom, showGuides, or livePreview changes
  useEffect(() => {
    if (template && canvasRef.current) {
      drawCanvas();
    }
  }, [template, activeSide, zoom, showGuides, showGrid, livePreview, selectedElementId]);

  const pushHistory = (newTemplate: IdTemplate) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(JSON.parse(JSON.stringify(newTemplate)));
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setTemplate(newTemplate);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const currentSideData = activeSide === 'FRONT' ? template?.frontData : template?.backData;
  const currentElements = currentSideData?.elements || [];
  const selectedElement = currentElements.find(e => e.id === selectedElementId);

  const getCanvasDimensions = () => {
    const isPortrait = template?.orientation === 'PORTRAIT';
    return {
      width: isPortrait ? 378 : 600,
      height: isPortrait ? 600 : 378,
    };
  };

  const drawCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: baseWidth, height: baseHeight } = getCanvasDimensions();
    const scale = zoom;
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;

    ctx.save();
    ctx.scale(scale, scale);

    if (livePreview && sampleRecord) {
      await CardRenderer.renderToCanvas(canvas, {
        template,
        side: activeSide,
        record: sampleRecord,
        school: currentSchool,
        scale: zoom,
      });
    } else {
      // Clear background
      const sideData = activeSide === 'FRONT' ? template.frontData : template.backData;
      ctx.fillStyle = sideData.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Render elements
      const elementsToRender = sideData.elements || [];
      for (const el of elementsToRender) {
        if (el.visible === false) continue;
        ctx.save();
        ctx.globalAlpha = el.opacity ?? 1;

        if (el.type === 'rect') {
          ctx.fillStyle = el.fill || '#e2e8f0';
          if (el.rx || el.ry) {
            const r = el.rx || el.ry || 0;
            ctx.beginPath();
            ctx.roundRect(el.left, el.top, el.width, el.height, r);
            ctx.fill();
          } else {
            ctx.fillRect(el.left, el.top, el.width, el.height);
          }
          if (el.stroke && el.strokeWidth) {
            ctx.strokeStyle = el.stroke;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
          }
        } else if (el.type === 'circle') {
          ctx.fillStyle = el.fill || '#e2e8f0';
          ctx.beginPath();
          const radius = Math.min(el.width, el.height) / 2;
          ctx.arc(el.left + radius, el.top + radius, radius, 0, Math.PI * 2);
          ctx.fill();
          if (el.stroke && el.strokeWidth) {
            ctx.strokeStyle = el.stroke;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
          }
        } else if (el.type === 'text') {
          ctx.fillStyle = el.fill || '#000000';
          ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize || 14}px "${el.fontFamily || 'Plus Jakarta Sans'}", sans-serif`;
          ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
          ctx.textBaseline = 'top';
          const textToDraw = el.variableBinding || el.text || 'Sample Text';
          const renderX = el.textAlign === 'center' ? el.left + el.width / 2 : el.textAlign === 'right' ? el.left + el.width : el.left;
          ctx.fillText(textToDraw, renderX, el.top);
        } else if (el.type === 'image') {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(el.left, el.top, el.width, el.height);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.strokeRect(el.left, el.top, el.width, el.height);

          ctx.fillStyle = '#475569';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.isDynamicPhoto ? '👤 [PHOTO PLACEHOLDER]' : '🖼️ [IMAGE]', el.left + el.width / 2, el.top + el.height / 2);
        } else if (el.type === 'qrcode') {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(el.left, el.top, el.width, el.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(el.left, el.top, el.width, el.height);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⬛ QR VERIFY', el.left + el.width / 2, el.top + el.height / 2);
        } else if (el.type === 'barcode') {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(el.left, el.top, el.width, el.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(el.left, el.top, el.width, el.height);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('||||||| BARCODE |||||||', el.left + el.width / 2, el.top + el.height / 2);
        }

        ctx.restore();
      }
    }

    // Draw Guides (Bleed & Safe Area)
    if (showGuides && !livePreview) {
      const bleedPx = 15;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(bleedPx, bleedPx, baseWidth - bleedPx * 2, baseHeight - bleedPx * 2);

      // Card punch hole guide top center
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.arc(baseWidth / 2, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw selected element bounding box
    if (selectedElement && !livePreview) {
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectedElement.left - 2, selectedElement.top - 2, selectedElement.width + 4, selectedElement.height + 4);

      // 4 corner handles
      const handleSize = 6;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      [
        [selectedElement.left - 2, selectedElement.top - 2],
        [selectedElement.left + selectedElement.width + 2, selectedElement.top - 2],
        [selectedElement.left - 2, selectedElement.top + selectedElement.height + 2],
        [selectedElement.left + selectedElement.width + 2, selectedElement.top + selectedElement.height + 2],
      ].forEach(([hx, hy]) => {
        ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
      });
    }

    ctx.restore();
  };

  // Canvas Click Detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !template || livePreview) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    const sideData = activeSide === 'FRONT' ? template.frontData : template.backData;
    const elements = sideData.elements || [];
    // Iterate in reverse (top-most layer first)
    const clicked = [...elements].reverse().find(el => {
      return (
        clickX >= el.left &&
        clickX <= el.left + el.width &&
        clickY >= el.top &&
        clickY <= el.top + el.height
      );
    });

    if (clicked) {
      setSelectedElementId(clicked.id);
    } else {
      setSelectedElementId(null);
    }
  };

  // Add Element Helper
  const addElement = (newEl: Partial<CanvasElement>) => {
    if (!template) return;
    const element: CanvasElement = {
      id: `el-${Date.now()}`,
      type: newEl.type || 'text',
      name: newEl.name || 'New Element',
      left: newEl.left || 40,
      top: newEl.top || 40,
      width: newEl.width || 180,
      height: newEl.height || 30,
      zIndex: (currentElements.length || 0) + 1,
      visible: true,
      locked: false,
      opacity: 1,
      ...newEl,
    };

    const updatedTemplate = { ...template };
    if (activeSide === 'FRONT') {
      updatedTemplate.frontData = {
        ...template.frontData,
        elements: [...template.frontData.elements, element],
      };
    } else {
      updatedTemplate.backData = {
        ...template.backData,
        elements: [...template.backData.elements, element],
      };
    }
    pushHistory(updatedTemplate);
    setSelectedElementId(element.id);
  };

  // Update selected element property
  const updateSelected = (props: Partial<CanvasElement>) => {
    if (!template || !selectedElementId) return;
    const updatedTemplate = { ...template };
    const sideData = activeSide === 'FRONT' ? template.frontData : template.backData;
    const elements = [...sideData.elements];
    const index = elements.findIndex(e => e.id === selectedElementId);
    if (index === -1) return;

    elements[index] = { ...elements[index], ...props };
    if (activeSide === 'FRONT') {
      updatedTemplate.frontData = { ...template.frontData, elements };
    } else {
      updatedTemplate.backData = { ...template.backData, elements };
    }
    pushHistory(updatedTemplate);
  };

  // Delete selected element
  const deleteSelected = () => {
    if (!template || !selectedElementId) return;
    const updatedTemplate = { ...template };
    const sideData = activeSide === 'FRONT' ? template.frontData : template.backData;
    const elements = sideData.elements.filter(e => e.id !== selectedElementId);
    if (activeSide === 'FRONT') {
      updatedTemplate.frontData = { ...template.frontData, elements };
    } else {
      updatedTemplate.backData = { ...template.backData, elements };
    }
    pushHistory(updatedTemplate);
    setSelectedElementId(null);
  };

  // Save Template to Persistent Storage
  const handleSaveTemplate = () => {
    if (!template) return;
    storage.saveTemplate(template, 'Updated in ID Designer Studio');
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  // Export card as PNG
  const handleExportPng = async () => {
    if (!template) return;
    const pngDataUrl = await CardRenderer.exportCardImage({
      template,
      side: activeSide,
      record: sampleRecord,
      school: currentSchool,
      scale: 2,
    });
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = `${(template?.name || 'id_template').replace(/\s+/g, '_')}_${activeSide}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!template) return null;

  const { width: baseWidth, height: baseHeight } = getCanvasDimensions();

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#0A0B0E] text-[#E0E0E3] overflow-hidden select-none">
      {/* Top Application Bar */}
      <div className="h-14 bg-[#0F1115] border-b border-[#1F2128] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-[#1F2128] text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={template.name}
                onChange={e => {
                  const updated = { ...template, name: e.target.value };
                  setTemplate(updated);
                }}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-[#2D3038] focus:border-indigo-500 outline-none text-[#E0E0E3] px-1"
              />
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v{template.version || 1}.0
              </span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
              {template.orientation} • CR80 (85.6 × 53.98 mm)
            </p>
          </div>
        </div>

        {/* Center Canvas Tools */}
        <div className="flex items-center space-x-1 bg-[#1F2128] p-1 rounded-lg border border-[#2D3038]">
          <div className="flex bg-[#0F1115] rounded-md p-0.5">
            <button
              onClick={() => {
                setActiveSide('FRONT');
                setSelectedElementId(null);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeSide === 'FRONT'
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Front Side
            </button>
            <button
              onClick={() => {
                setActiveSide('BACK');
                setSelectedElementId(null);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeSide === 'BACK'
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Back Side
            </button>
          </div>

          <div className="h-4 w-px bg-[#2D3038] mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-[#252832] text-gray-400 hover:text-white disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-[#252832] text-gray-400 hover:text-white disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#2D3038] mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => setZoom(Math.max(0.6, zoom - 0.1))}
            className="p-1.5 rounded hover:bg-[#252832] text-gray-400 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono px-1 text-gray-300 font-semibold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(1.8, zoom + 0.1))}
            className="p-1.5 rounded hover:bg-[#252832] text-gray-400 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#2D3038] mx-1" />

          {/* Guides & Live Preview Toggle */}
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`p-1.5 rounded transition-colors ${
              showGuides ? 'bg-indigo-600/30 text-indigo-400' : 'text-gray-400 hover:bg-[#252832]'
            }`}
            title="Toggle Bleed & Safe Margin Guides"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLivePreview(!livePreview)}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
              livePreview
                ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-[#1F2128] text-gray-300 hover:bg-[#252832]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{livePreview ? 'Live Data' : 'Design'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPng}
            className="px-3 py-1.5 rounded-lg bg-[#1F2128] border border-[#2D3038] text-gray-300 hover:bg-[#252832] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
          <button
            onClick={handleSaveTemplate}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar Tabs */}
        <div className="w-16 bg-[#0F1115] border-r border-[#1F2128] flex flex-col items-center py-6 gap-6 shrink-0">
          {[
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'elements', icon: Square, label: 'Shapes' },
            { id: 'photo', icon: ImageIcon, label: 'Photos' },
            { id: 'qr', icon: QrCode, label: 'Codes' },
            { id: 'variables', icon: Tag, label: 'Fields' },
            { id: 'layers', icon: Layers, label: 'Layers' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#1F2128] text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.2)]'
                    : 'text-gray-500 hover:text-white hover:bg-[#1F2128]/50'
                }`}
                title={tab.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-semibold mt-0.5 tracking-tighter">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Left Sub-Panel */}
        <div className="w-72 bg-[#0F1115] border-r border-[#1F2128] p-4 overflow-y-auto shrink-0">
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="font-bold text-xs uppercase tracking-widest text-gray-500">
                Add Typography
              </div>
              <button
                onClick={() =>
                  addElement({
                    type: 'text',
                    name: 'School Header',
                    text: 'REPUBLIC OF THE PHILIPPINES',
                    fontSize: 12,
                    fontWeight: 'bold',
                    fill: '#1e293b',
                    left: 40,
                    top: 20,
                    width: 320,
                    height: 20,
                    textAlign: 'center',
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left font-semibold text-xs text-[#E0E0E3] transition-colors"
              >
                + School Header Text
              </button>
              <button
                onClick={() =>
                  addElement({
                    type: 'text',
                    name: 'Dynamic Student Name',
                    text: '{{first_name}} {{last_name}}',
                    variableBinding: '{{first_name}} {{last_name}}',
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: '#0f172a',
                    left: 180,
                    top: 90,
                    width: 300,
                    height: 24,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left font-semibold text-xs text-indigo-300 transition-colors"
              >
                + Dynamic Name (&#123;&#123;first_name&#125;&#125;)
              </button>
              <button
                onClick={() =>
                  addElement({
                    type: 'text',
                    name: 'LRN Field',
                    text: 'LRN: {{lrn}}',
                    variableBinding: 'LRN: {{lrn}}',
                    fontSize: 12,
                    fontWeight: 'normal',
                    fill: '#475569',
                    left: 180,
                    top: 120,
                    width: 250,
                    height: 18,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left text-xs text-gray-400 hover:text-white transition-colors"
              >
                + Subtitle / Field Label
              </button>
            </div>
          )}

          {activeTab === 'elements' && (
            <div className="space-y-3">
              <div className="font-bold text-xs uppercase tracking-widest text-gray-500">
                Vector Shapes
              </div>
              <button
                onClick={() =>
                  addElement({
                    type: 'rect',
                    name: 'Header Banner',
                    fill: '#4f46e5',
                    left: 0,
                    top: 0,
                    width: baseWidth,
                    height: 60,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left font-semibold text-xs text-[#E0E0E3] transition-colors"
              >
                + Top Accent Color Banner
              </button>
              <button
                onClick={() =>
                  addElement({
                    type: 'rect',
                    name: 'Card Info Box',
                    fill: '#f1f5f9',
                    rx: 8,
                    left: 20,
                    top: 80,
                    width: baseWidth - 40,
                    height: 200,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left font-semibold text-xs text-[#E0E0E3] transition-colors"
              >
                + Rounded Content Card
              </button>
              <button
                onClick={() =>
                  addElement({
                    type: 'circle',
                    name: 'Seal Backing Circle',
                    fill: '#e0e7ff',
                    left: 40,
                    top: 15,
                    width: 45,
                    height: 45,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left font-semibold text-xs text-[#E0E0E3] transition-colors"
              >
                + Circle Badge
              </button>
            </div>
          )}

          {activeTab === 'photo' && (
            <div className="space-y-3">
              <div className="font-bold text-xs uppercase tracking-widest text-gray-500">
                Photos & Seals
              </div>
              <button
                onClick={() =>
                  addElement({
                    type: 'image',
                    name: 'Dynamic Student Photo',
                    isDynamicPhoto: true,
                    left: 30,
                    top: 80,
                    width: 120,
                    height: 150,
                    rx: 6,
                    stroke: '#cbd5e1',
                    strokeWidth: 2,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-left font-semibold text-indigo-300 text-xs transition-colors"
              >
                + Dynamic Student/Teacher Photo
              </button>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-3">
              <div className="font-bold text-xs uppercase tracking-widest text-gray-500">
                Security Codes
              </div>
              <button
                onClick={() =>
                  addElement({
                    type: 'qrcode',
                    name: 'Security QR Code',
                    isDynamicQr: true,
                    left: baseWidth - 110,
                    top: baseHeight - 110,
                    width: 80,
                    height: 80,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left font-semibold flex items-center gap-2 text-xs text-emerald-300 transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>+ Encrypted Verification QR</span>
              </button>
              <button
                onClick={() =>
                  addElement({
                    type: 'barcode',
                    name: 'Code-128 Barcode',
                    isDynamicBarcode: true,
                    variableBinding: '{{lrn}}',
                    left: 30,
                    top: baseHeight - 65,
                    width: 240,
                    height: 45,
                  })
                }
                className="w-full p-2.5 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left font-semibold flex items-center gap-2 text-xs text-sky-300 transition-colors"
              >
                <Barcode className="w-4 h-4 text-sky-400" />
                <span>+ Code-128 Barcode (LRN)</span>
              </button>
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">
                Click Variable to Insert
              </div>
              {[
                { tag: '{{first_name}}', desc: 'First Name' },
                { tag: '{{last_name}}', desc: 'Last Name' },
                { tag: '{{lrn}}', desc: '12-Digit LRN' },
                { tag: '{{employee_no}}', desc: 'Employee #' },
                { tag: '{{grade_level}}', desc: 'Grade Level' },
                { tag: '{{school_name}}', desc: 'School Name' },
                { tag: '{{blood_type}}', desc: 'Blood Group' },
                { tag: '{{rfid_number}}', desc: 'Smart RFID UID' },
                { tag: '{{guardian_name}}', desc: 'Guardian Contact' },
                { tag: '{{guardian_contact}}', desc: 'Guardian Mobile' },
              ].map(v => (
                <button
                  key={v.tag}
                  onClick={() => {
                    if (selectedElement && selectedElement.type === 'text') {
                      updateSelected({
                        text: (selectedElement.text || '') + ' ' + v.tag,
                        variableBinding: (selectedElement.variableBinding || selectedElement.text || '') + ' ' + v.tag,
                      });
                    }
                  }}
                  className="w-full p-2 rounded-lg bg-[#1F2128] hover:bg-[#252832] border border-[#2D3038] text-left flex items-center justify-between text-xs transition-colors"
                >
                  <span className="font-mono text-indigo-400 font-bold text-[11px]">{v.tag}</span>
                  <span className="text-gray-400 text-[10px]">{v.desc}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-widest text-gray-500">
                Layer Hierarchy ({currentElements.length})
              </div>
              <div className="space-y-1.5">
                {[...currentElements].reverse().map(el => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                      selectedElementId === el.id
                        ? 'bg-indigo-600 text-white font-semibold shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                        : 'bg-[#1F2128] text-gray-300 hover:bg-[#252832]'
                    }`}
                  >
                    <span className="truncate text-xs">{el.name}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        updateSelected({ visible: el.visible === false ? true : false });
                      }}
                      className="opacity-70 hover:opacity-100"
                    >
                      {el.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Stage (Canvas Viewer) */}
        <div className="flex-1 bg-[#08080A] p-8 flex flex-col items-center justify-center overflow-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0%,transparent_70%)] pointer-events-none" />

          {/* Canvas Board with glowing backplate */}
          <div className="relative group z-10">
            <div className="absolute -inset-1.5 bg-gradient-to-b from-indigo-500/25 to-purple-500/25 rounded-[22px] blur-lg opacity-60 pointer-events-none" />
            <div className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-[#2D3038] bg-white">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="cursor-crosshair block"
              />
            </div>
          </div>

          {/* Bottom Floating Status Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1F2128]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#2D3038] text-xs text-gray-400 shadow-2xl z-20">
            <span className="font-mono">
              {baseWidth} × {baseHeight}px @ 300 DPI
            </span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">{activeSide}</span>
            <span>•</span>
            <span>{currentElements.length} vector objects</span>
          </div>

          {/* Saved Notification */}
          {savedNotification && (
            <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4 z-30">
              <Check className="w-4 h-4" />
              <span>Template saved to database!</span>
            </div>
          )}
        </div>

        {/* Right Properties Inspector */}
        <div className="w-[280px] bg-[#0F1115] border-l border-[#1F2128] p-4 overflow-y-auto space-y-5 shrink-0 text-xs">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1F2128]">
                <span className="font-bold text-[#E0E0E3] text-xs uppercase tracking-wider">
                  {selectedElement.name}
                </span>
                <button
                  onClick={deleteSelected}
                  className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/50"
                  title="Delete Element"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Coordinates & Geometry */}
              <div className="space-y-2">
                <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                  Position & Dimensions
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="bg-[#1F2128] p-2 rounded-lg border border-[#2D3038] flex items-center justify-between">
                    <span className="text-gray-400">Left:</span>
                    <input
                      type="number"
                      value={selectedElement.left}
                      onChange={e => updateSelected({ left: Number(e.target.value) })}
                      className="w-16 bg-transparent text-right outline-none font-bold text-[#E0E0E3]"
                    />
                  </div>
                  <div className="bg-[#1F2128] p-2 rounded-lg border border-[#2D3038] flex items-center justify-between">
                    <span className="text-gray-400">Top:</span>
                    <input
                      type="number"
                      value={selectedElement.top}
                      onChange={e => updateSelected({ top: Number(e.target.value) })}
                      className="w-16 bg-transparent text-right outline-none font-bold text-[#E0E0E3]"
                    />
                  </div>
                  <div className="bg-[#1F2128] p-2 rounded-lg border border-[#2D3038] flex items-center justify-between">
                    <span className="text-gray-400">Width:</span>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={e => updateSelected({ width: Number(e.target.value) })}
                      className="w-16 bg-transparent text-right outline-none font-bold text-[#E0E0E3]"
                    />
                  </div>
                  <div className="bg-[#1F2128] p-2 rounded-lg border border-[#2D3038] flex items-center justify-between">
                    <span className="text-gray-400">Height:</span>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={e => updateSelected({ height: Number(e.target.value) })}
                      className="w-16 bg-transparent text-right outline-none font-bold text-[#E0E0E3]"
                    />
                  </div>
                </div>
              </div>

              {/* Text specific styling */}
              {selectedElement.type === 'text' && (
                <div className="space-y-3">
                  <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                    Typography & Content
                  </label>
                  <textarea
                    rows={2}
                    value={selectedElement.variableBinding || selectedElement.text || ''}
                    onChange={e => updateSelected({ text: e.target.value, variableBinding: e.target.value })}
                    className="w-full p-2 rounded-lg bg-[#1F2128] border border-[#2D3038] text-[#E0E0E3] outline-none text-xs font-mono focus:border-indigo-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-gray-400 text-[10px]">Font Size</span>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 14}
                        onChange={e => updateSelected({ fontSize: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg bg-[#1F2128] border border-[#2D3038] text-[#E0E0E3] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400 text-[10px]">Weight</span>
                      <select
                        value={selectedElement.fontWeight || 'normal'}
                        onChange={e => updateSelected({ fontWeight: e.target.value })}
                        className="w-full p-1.5 rounded-lg bg-[#1F2128] border border-[#2D3038] text-[#E0E0E3] font-bold"
                      >
                        <option value="normal" className="bg-[#0F1115]">Regular</option>
                        <option value="bold" className="bg-[#0F1115]">Bold</option>
                        <option value="900" className="bg-[#0F1115]">Black</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-gray-400 text-[10px]">Text Alignment</span>
                    <div className="grid grid-cols-3 gap-1 bg-[#1F2128] p-1 rounded-lg border border-[#2D3038]">
                      <button
                        onClick={() => updateSelected({ textAlign: 'left' })}
                        className={`p-1.5 rounded ${selectedElement.textAlign === 'left' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                      >
                        <AlignLeft className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <button
                        onClick={() => updateSelected({ textAlign: 'center' })}
                        className={`p-1.5 rounded ${selectedElement.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                      >
                        <AlignCenter className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <button
                        onClick={() => updateSelected({ textAlign: 'right' })}
                        className={`p-1.5 rounded ${selectedElement.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                      >
                        <AlignRight className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Color & Fills */}
              <div className="space-y-2">
                <label className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                  Fill & Colors
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.fill || '#000000'}
                    onChange={e => updateSelected({ fill: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={selectedElement.fill || '#000000'}
                    onChange={e => updateSelected({ fill: e.target.value })}
                    className="flex-1 p-1.5 rounded-lg bg-[#1F2128] border border-[#2D3038] text-[#E0E0E3] font-mono uppercase text-xs"
                  />
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Opacity</span>
                  <span>{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={selectedElement.opacity ?? 1}
                  onChange={e => updateSelected({ opacity: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2 py-20">
              <Sliders className="w-8 h-8 opacity-40" />
              <p className="font-semibold text-xs">No Element Selected</p>
              <p className="text-[11px] text-gray-600 max-w-[180px]">
                Click any element on the canvas to inspect and edit properties.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
