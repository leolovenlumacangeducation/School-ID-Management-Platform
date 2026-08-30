import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Sparkles, User, RefreshCw, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { storage } from '../../services/storageService';
import { Teacher, Student } from '../../types';

interface PhotoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'TEACHER' | 'STUDENT';
  schoolId: string;
  onPhotosUpdated: () => void;
}

export const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({
  isOpen,
  onClose,
  targetType,
  schoolId,
  onPhotosUpdated,
}) => {
  const [matchedFiles, setMatchedFiles] = useState<{
    fileName: string;
    idNumber: string;
    previewUrl: string;
    matchedRecord?: Teacher | Student;
    status: 'MATCHED' | 'UNMATCHED';
  }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const teachers = storage.getTeachers(schoolId);
  const students = storage.getStudents(schoolId);

  const handleSimulateBulkUpload = () => {
    // Generate realistic batch matching simulation
    if (targetType === 'TEACHER') {
      const simulated = teachers.slice(0, 4).map(t => ({
        fileName: `${t.employeeNo}.jpg`,
        idNumber: t.employeeNo,
        previewUrl: t.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        matchedRecord: t,
        status: 'MATCHED' as const,
      }));
      setMatchedFiles(simulated);
      if (simulated[0]) setSelectedPreview(simulated[0].previewUrl);
    } else {
      const simulated = students.slice(0, 5).map(s => ({
        fileName: `${s.lrn}.jpg`,
        idNumber: s.lrn,
        previewUrl: s.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        matchedRecord: s,
        status: 'MATCHED' as const,
      }));
      setMatchedFiles(simulated);
      if (simulated[0]) setSelectedPreview(simulated[0].previewUrl);
    }
  };

  const handleApplyMatched = () => {
    matchedFiles.forEach(item => {
      if (item.matchedRecord && item.status === 'MATCHED') {
        if (targetType === 'TEACHER') {
          const t = item.matchedRecord as Teacher;
          storage.saveTeacher({ ...t, photoUrl: item.previewUrl });
        } else {
          const s = item.matchedRecord as Student;
          storage.saveStudent({ ...s, photoUrl: item.previewUrl });
        }
      }
    });
    onPhotosUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Bulk Photo Matcher & Headshot Align Tool</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Auto-link photos named by {targetType === 'TEACHER' ? 'Employee Number (e.g. EMP-2021-0842.jpg)' : '12-Digit LRN (e.g. 109283746192.jpg)'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Dropzone Area */}
          {matchedFiles.length === 0 ? (
            <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  Drag and drop ZIP archive or multiple JPEG / PNG images
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  Files will be mapped automatically to {targetType === 'TEACHER' ? 'Teacher Employee #' : 'Student LRN'}
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleSimulateBulkUpload}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Sample Batch & Match Test</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Matched Photos ({matchedFiles.length})</span>
                  <button
                    onClick={() => setMatchedFiles([])}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {matchedFiles.map(file => (
                    <div
                      key={file.fileName}
                      onClick={() => setSelectedPreview(file.previewUrl)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        selectedPreview === file.previewUrl
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={file.previewUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {file.matchedRecord ? `${file.matchedRecord.firstName} ${file.matchedRecord.lastName}` : 'Unmatched'}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {file.fileName}
                          </div>
                        </div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Face Alignment Preview */}
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-3">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Passport Face Alignment Guide
                </div>

                <div className="relative w-40 h-48 rounded-2xl overflow-hidden bg-slate-900 ring-2 ring-indigo-500 shadow-xl flex items-center justify-center">
                  {selectedPreview && (
                    <img
                      src={selectedPreview}
                      alt=""
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="w-full h-full object-cover transition-transform"
                    />
                  )}
                  {/* Face oval guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-24 h-32 rounded-full border-2 border-dashed border-amber-400/80"></div>
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] font-semibold">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
          >
            Cancel
          </button>

          {matchedFiles.length > 0 && (
            <button
              onClick={handleApplyMatched}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save {matchedFiles.length} Photos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
