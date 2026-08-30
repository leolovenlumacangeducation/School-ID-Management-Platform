import React, { useState, useEffect } from 'react';
import { Search, School, User, GraduationCap, LayoutTemplate, Printer, ShieldCheck, FileText, Settings, X, ArrowRight } from 'lucide-react';
import { storage } from '../../services/storageService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string, itemId?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [teachers, setTeachers] = useState(storage.getTeachers('all'));
  const [students, setStudents] = useState(storage.getStudents('all'));
  const [schools, setSchools] = useState(storage.getSchools());
  const [templates, setTemplates] = useState(storage.getTemplates('all'));

  useEffect(() => {
    if (isOpen) {
      setTeachers(storage.getTeachers('all'));
      setStudents(storage.getStudents('all'));
      setSchools(storage.getSchools());
      setTemplates(storage.getTemplates('all'));
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = (query || '').toLowerCase();

  const filteredTeachers = teachers.filter(t => 
    `${t.firstName || ''} ${t.lastName || ''} ${t.employeeNo || ''} ${t.department || ''}`.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredStudents = students.filter(s => 
    `${s.firstName || ''} ${s.lastName || ''} ${s.lrn || ''} ${s.gradeLevel || ''}`.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredSchools = schools.filter(s => 
    `${s.name || ''} ${s.schoolId || ''} ${s.division || ''}`.toLowerCase().includes(q)
  ).slice(0, 3);

  const filteredTemplates = templates.filter(t => 
    (t.name || '').toLowerCase().includes(q)
  ).slice(0, 3);

  const navItems = [
    { label: 'Go to Dashboard', module: 'dashboard', icon: FileText },
    { label: 'Go to Print Center', module: 'print', icon: Printer },
    { label: 'Go to ID Designer', module: 'designer', icon: LayoutTemplate },
    { label: 'Go to Verification Portal', module: 'verify', icon: ShieldCheck },
    { label: 'Go to System Backups & Settings', module: 'settings', icon: Settings },
  ].filter(i => (i.label || '').toLowerCase().includes(q));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search students (LRN), teachers, schools, templates, or jump to module..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Quick Navigation */}
          {navItems.length > 0 && (
            <div>
              <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Quick Navigation
              </div>
              <div className="space-y-1 mt-1">
                {navItems.map(item => (
                  <button
                    key={item.module}
                    onClick={() => {
                      onNavigate(item.module);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left font-medium"
                  >
                    <div className="flex items-center space-x-2.5">
                      <item.icon className="w-4 h-4 text-indigo-500" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Students Section */}
          {filteredStudents.length > 0 && (
            <div>
              <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Students ({filteredStudents.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      onNavigate('students', student.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={student.photoUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          LRN: {student.lrn} • {student.gradeLevel}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Student
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teachers Section */}
          {filteredTeachers.length > 0 && (
            <div>
              <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Teachers & Faculty ({filteredTeachers.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredTeachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      onNavigate('teachers', teacher.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={teacher.photoUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {teacher.employeeNo} • {teacher.position}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Faculty
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Schools Section */}
          {filteredSchools.length > 0 && (
            <div>
              <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Schools ({filteredSchools.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredSchools.map(school => (
                  <button
                    key={school.id}
                    onClick={() => {
                      onNavigate('schools', school.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <School className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {school.name}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {school.schoolId} • {school.region}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && filteredTeachers.length === 0 && filteredSchools.length === 0 && navItems.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              No matching records found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-xs font-mono text-[10px]">
              ↑↓
            </kbd>
            <span>Select:</span>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-xs font-mono text-[10px]">
              ↵
            </kbd>
          </div>
          <div>Press ESC to close</div>
        </div>
      </div>
    </div>
  );
};
