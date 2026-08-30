import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCw, Download, Printer, ShieldCheck, Sparkles } from 'lucide-react';
import { CardRenderer } from '../../services/cardRenderer';
import { IdTemplate, Teacher, Student, School } from '../../types';

interface CardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Teacher | Student;
  school: School;
  template: IdTemplate;
  onNavigateToDesigner?: (templateId: string) => void;
  onPrintSingle?: () => void;
}

export const CardPreviewModal: React.FC<CardPreviewModalProps> = ({
  isOpen,
  onClose,
  record,
  school,
  template,
  onNavigateToDesigner,
  onPrintSingle,
}) => {
  const [activeSide, setActiveSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [isFlipping, setIsFlipping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      renderCurrentSide();
    }
  }, [isOpen, activeSide, record, school, template]);

  const renderCurrentSide = async () => {
    if (!canvasRef.current) return;
    await CardRenderer.renderToCanvas(canvasRef.current, {
      template,
      side: activeSide,
      record,
      school,
      scale: 1.5,
    });
  };

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setActiveSide(prev => (prev === 'FRONT' ? 'BACK' : 'FRONT'));
      setIsFlipping(false);
    }, 150);
  };

  const handleDownloadPng = async () => {
    const dataUrl = await CardRenderer.exportCardImage({
      template,
      side: activeSide,
      record,
      school,
      scale: 2,
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    const name = `${record?.firstName || 'record'}_${record?.lastName || 'card'}_${activeSide}.png`.toLowerCase().replace(/\s+/g, '_');
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!isOpen) return null;

  const isTeacher = 'employeeNo' in record;
  const isLandscape = template.orientation === 'LANDSCAPE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Live Card Verification & Preview
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {record.firstName} {record.lastName} ({isTeacher ? (record as Teacher).employeeNo : (record as Student).lrn})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleFlip}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip to {activeSide === 'FRONT' ? 'Back' : 'Front'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Stage / Canvas Display */}
        <div className="p-8 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/80 canvas-checkerboard min-h-[380px] overflow-hidden">
          <div
            className={`transition-all duration-200 transform shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 ${
              isFlipping ? 'scale-90 opacity-50 rotate-y-90' : 'scale-100 opacity-100'
            }`}
          >
            <canvas
              ref={canvasRef}
              className="max-h-[460px] object-contain rounded-2xl block bg-white"
            />
          </div>

          <div className="mt-4 flex items-center space-x-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Side: {activeSide}
            </span>
            <span>CR80 ISO 7810 Standard (85.6mm x 53.98mm)</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              HASH: {record.verifyHash.substring(0, 10)}...
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {onNavigateToDesigner && (
              <button
                onClick={() => {
                  onNavigateToDesigner(template.id);
                  onClose();
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customize Template in Canvas</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPng}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center space-x-1.5 shadow-2xs hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {activeSide} PNG</span>
            </button>
            {onPrintSingle && (
              <button
                onClick={onPrintSingle}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1.5 shadow-sm shadow-indigo-600/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Send to Print Center</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
