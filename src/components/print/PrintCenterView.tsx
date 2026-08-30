import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  FileDown,
  Layers,
  Settings2,
  CheckCircle,
  Sliders,
  Sparkles,
  Eye,
  RotateCw,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { CardRenderer } from '../../services/cardRenderer';
import { School, Student, Teacher, IdTemplate, PrintJobConfig } from '../../types';

interface PrintCenterViewProps {
  activeSchoolId: string;
  onNavigateToDesigner?: (templateId: string) => void;
}

export const PrintCenterView: React.FC<PrintCenterViewProps> = ({ activeSchoolId, onNavigateToDesigner }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [templates, setTemplates] = useState<IdTemplate[]>([]);

  // Selection state
  const [targetGroup, setTargetGroup] = useState<'STUDENTS' | 'TEACHERS'>('STUDENTS');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');

  // Print Sheet Configuration
  const [paperSize, setPaperSize] = useState<'A4' | 'LETTER' | 'LEGAL' | 'CR80_SINGLE'>('A4');
  const [cardsPerPage, setCardsPerPage] = useState<number>(8);
  const [sidesMode, setSidesMode] = useState<'FRONT_ONLY' | 'BACK_ONLY' | 'DUPLEX_BOTH'>('DUPLEX_BOTH');
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(true);
  const [includeBleed, setIncludeBleed] = useState<boolean>(true);

  // Preview page state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfReadyUrl, setPdfReadyUrl] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadData();
  }, [activeSchoolId]);

  const loadData = () => {
    const loadedSchools = storage.getSchools();
    const loadedStudents = storage.getStudents(activeSchoolId);
    const loadedTeachers = storage.getTeachers(activeSchoolId);
    const loadedTemplates = storage.getTemplates(activeSchoolId);

    setSchools(loadedSchools);
    setStudents(loadedStudents);
    setTeachers(loadedTeachers);
    setTemplates(loadedTemplates);

    if (loadedTemplates.length > 0) {
      setActiveTemplateId(loadedTemplates[0].id);
    }

    // Default select all students
    setSelectedIds(loadedStudents.map(s => s.id));
  };

  const activeSchool = schools.find(s => s.id === activeSchoolId) || schools[0];
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];

  // Records available based on target group and filters
  const availableRecords = targetGroup === 'STUDENTS'
    ? students.filter(s => gradeFilter === 'ALL' || s.gradeLevel === gradeFilter)
    : teachers;

  const selectedRecords = availableRecords.filter(r => selectedIds.includes(r.id));

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === availableRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableRecords.map(r => r.id));
    }
  };

  // Render sheet preview page on canvas
  useEffect(() => {
    renderSheetPreview();
  }, [
    selectedRecords,
    activeTemplate,
    paperSize,
    cardsPerPage,
    sidesMode,
    includeCropMarks,
    includeBleed,
    currentPage,
  ]);

  const renderSheetPreview = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !activeTemplate || selectedRecords.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sheet dimensions in points (A4: 595 x 842)
    let sheetW = 595;
    let sheetH = 842;
    if (paperSize === 'LETTER') {
      sheetW = 612;
      sheetH = 792;
    } else if (paperSize === 'LEGAL') {
      sheetW = 612;
      sheetH = 1008;
    } else if (paperSize === 'CR80_SINGLE') {
      sheetW = 243;
      sheetH = 153;
    }

    canvas.width = sheetW;
    canvas.height = sheetH;

    // White paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetW, sheetH);

    // Margins and layout math
    const margin = 24;
    const cols = cardsPerPage === 1 ? 1 : cardsPerPage === 2 ? 1 : cardsPerPage === 4 ? 2 : cardsPerPage === 8 ? 2 : 2;
    const rows = cardsPerPage === 1 ? 1 : cardsPerPage === 2 ? 2 : cardsPerPage === 4 ? 2 : cardsPerPage === 8 ? 4 : 5;

    const availableW = sheetW - margin * 2;
    const availableH = sheetH - margin * 2;
    const cellW = availableW / cols;
    const cellH = availableH / rows;

    const cardW = 220;
    const cardH = 140;

    // Calculate items on this page
    const totalPages = Math.ceil(selectedRecords.length / cardsPerPage);
    const startIdx = (currentPage - 1) * cardsPerPage;
    const pageRecords = selectedRecords.slice(startIdx, startIdx + cardsPerPage);

    // Draw header text on sheet
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Inter';
    ctx.fillText(`SchoolID Enterprise Batch Print • ${activeSchool?.name || 'School'} • Sheet ${currentPage} of ${totalPages || 1}`, margin, 14);

    // Draw card slots
    pageRecords.forEach((record, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const posX = margin + col * cellW + (cellW - cardW) / 2;
      const posY = margin + row * cellH + (cellH - cardH) / 2;

      // Card boundary box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(posX, posY, cardW, cardH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(posX, posY, cardW, cardH);

      // Mini card simulation contents
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(posX, posY, cardW, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Inter';
      ctx.fillText(activeSchool?.name.substring(0, 28) || 'School Name', posX + 8, posY + 15);

      // Photo Box
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(posX + 10, posY + 35, 40, 50);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(posX + 10, posY + 35, 40, 50);

      // Student info text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px Inter';
      ctx.fillText(`${record.firstName} ${record.lastName}`, posX + 58, posY + 48);

      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText('lrn' in record ? `LRN: ${(record as Student).lrn}` : `EMP: ${(record as Teacher).employeeNo}`, posX + 58, posY + 62);

      // Micro QR
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(posX + cardW - 35, posY + cardH - 35, 25, 25);

      // Crop marks
      if (includeCropMarks) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        const markLen = 8;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(posX - markLen, posY);
        ctx.lineTo(posX, posY);
        ctx.moveTo(posX, posY - markLen);
        ctx.lineTo(posX, posY);
        // Top-right
        ctx.moveTo(posX + cardW + markLen, posY);
        ctx.lineTo(posX + cardW, posY);
        ctx.moveTo(posX + cardW, posY - markLen);
        ctx.lineTo(posX + cardW, posY);
        // Bottom-left
        ctx.moveTo(posX - markLen, posY + cardH);
        ctx.lineTo(posX, posY + cardH);
        ctx.moveTo(posX, posY + cardH + markLen);
        ctx.lineTo(posX, posY + cardH);
        // Bottom-right
        ctx.moveTo(posX + cardW + markLen, posY + cardH);
        ctx.lineTo(posX + cardW, posY + cardH);
        ctx.moveTo(posX + cardW, posY + cardH + markLen);
        ctx.lineTo(posX + cardW, posY + cardH);
        ctx.stroke();
      }
    });
  };

  // Generate High Resolution PDF
  const handleGeneratePdf = async () => {
    if (!activeTemplate || selectedRecords.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const config: PrintJobConfig = {
        schoolId: activeSchool.id,
        templateId: activeTemplate.id,
        cardType: targetGroup === 'STUDENTS' ? 'STUDENT' : 'TEACHER',
        selectedIds,
        sides: 'FRONT_ONLY',
        paperSize: paperSize === 'LETTER' ? 'LETTER' : paperSize === 'LEGAL' ? 'LEGAL' : 'A4',
        layout: cardsPerPage === 1 ? '1_UP' : cardsPerPage === 2 ? '2_UP' : cardsPerPage === 4 ? '4_UP' : cardsPerPage === 10 ? '10_UP' : '8_UP',
        showBleedMarks: includeBleed,
        showCropMarks: includeCropMarks,
        showSafeZone: true,
        bleedMm: 3,
        marginMm: 8,
        spacingMm: 4,
      };

      const doc = await CardRenderer.generatePrintSheetPdf(
        config,
        activeTemplate,
        selectedRecords,
        activeSchool
      );

      const fileName = `ID_Batch_Print_${activeSchool.schoolId || 'SCH'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generating PDF print sheet:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const totalPages = Math.ceil(selectedRecords.length / cardsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>High-Resolution Batch Print Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compile multi-up production sheets with 3mm bleed, vector crop marks, and duplex alignment.
          </p>
        </div>

        <button
          onClick={handleGeneratePdf}
          disabled={selectedRecords.length === 0 || isGeneratingPdf}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          {isGeneratingPdf ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Compiling Vector PDF Sheets...</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              <span>Download High-Res PDF ({selectedRecords.length} Cards)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Print Center Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Batch Selector & Print Sheet Config (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Selection Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>1. Batch Selection</span>
              </h3>
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => {
                    setTargetGroup('STUDENTS');
                    setSelectedIds(students.map(s => s.id));
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    targetGroup === 'STUDENTS'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Students ({students.length})
                </button>
                <button
                  onClick={() => {
                    setTargetGroup('TEACHERS');
                    setSelectedIds(teachers.map(t => t.id));
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    targetGroup === 'TEACHERS'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Teachers ({teachers.length})
                </button>
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 dark:text-slate-300 text-xs">
                Applied Template
              </label>
              <select
                value={activeTemplateId}
                onChange={e => setActiveTemplateId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
              >
                {templates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({(tpl.type || '').replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Records Checklist */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={handleSelectAll}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                >
                  {selectedIds.length === availableRecords.length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All ({availableRecords.length})</span>
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {selectedIds.length} Selected
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {availableRecords.map(rec => {
                  const isChecked = selectedIds.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleToggleSelect(rec.id)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <img
                          src={rec.photoUrl}
                          alt=""
                          className="w-6 h-6 rounded-lg object-cover"
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rec.firstName} {rec.lastName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 ml-2">
                            {'lrn' in rec ? (rec as Student).lrn : (rec as Teacher).employeeNo}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isChecked ? (
                          <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sheet & Printer Configuration Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>2. Sheet & Layout Properties</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Paper Media</label>
                <select
                  value={paperSize}
                  onChange={e => setPaperSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="LETTER">US Letter (8.5 x 11 in)</option>
                  <option value="LEGAL">US Legal (8.5 x 14 in)</option>
                  <option value="CR80_SINGLE">CR80 Direct PVC Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300">Cards Per Sheet</label>
                <select
                  value={cardsPerPage}
                  onChange={e => {
                    setCardsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  <option value={1}>1-Up (Single Card)</option>
                  <option value={2}>2-Up (2 Cards)</option>
                  <option value={4}>4-Up (4 Cards 2x2)</option>
                  <option value={8}>8-Up (8 Cards 2x4)</option>
                  <option value={10}>10-Up (10 Cards 2x5)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-300">Print Sides Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FRONT_ONLY', label: 'Front Only' },
                  { id: 'BACK_ONLY', label: 'Back Only' },
                  { id: 'DUPLEX_BOTH', label: 'Duplex (Both)' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSidesMode(mode.id as any)}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                      sidesMode === mode.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guides Checkboxes */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCropMarks}
                  onChange={e => setIncludeCropMarks(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Include Vector Corner Crop / Cut Marks
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBleed}
                  onChange={e => setIncludeBleed(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Include 3mm Production Bleed Overprint
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Print Sheet Canvas Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Live Sheet Layout Preview
              </h3>
              <p className="text-xs text-slate-400">
                Sheet Page {currentPage} of {totalPages} ({selectedRecords.length} Cards Total)
              </p>
            </div>

            {/* Page Pagination Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold px-2 text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Sheet Display */}
          <div className="my-6 flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950/70 rounded-2xl canvas-checkerboard overflow-hidden min-h-[460px]">
            <div className="shadow-2xl rounded-sm ring-1 ring-black/10 overflow-hidden bg-white">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[520px] object-contain block"
              />
            </div>
          </div>

          {/* Bottom sheet info footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>CR80 ISO 7810 Compliant • 300 DPI Rendering Engine</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Ready for Commercial Printing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
