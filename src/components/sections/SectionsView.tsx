import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  ArrowRightLeft,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Section, Teacher, Student } from '../../types';

interface SectionsViewProps {
  activeSchoolId: string;
  onNavigateToPrint?: () => void;
}

export const SectionsView: React.FC<SectionsViewProps> = ({ activeSchoolId, onNavigateToPrint }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
  const [inspectSection, setInspectSection] = useState<Section | null>(null);

  useEffect(() => {
    loadData();
  }, [activeSchoolId]);

  const loadData = () => {
    setSections(storage.getSections(activeSchoolId));
    setTeachers(storage.getTeachers(activeSchoolId));
    setStudents(storage.getStudents(activeSchoolId));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection?.name || !editingSection?.gradeLevel) return;

    const adviser = teachers.find(t => t.id === editingSection.adviserTeacherId);

    const sectionToSave: Section = {
      id: editingSection.id || `sec-${Date.now()}`,
      schoolId: editingSection.schoolId || (activeSchoolId !== 'all' ? activeSchoolId : 'sch-1'),
      gradeLevel: editingSection.gradeLevel,
      sectionName: editingSection.sectionName || (editingSection as any).name || 'Section 1',
      room: editingSection.room || (editingSection as any).roomNumber || 'Room 101',
      adviserId: editingSection.adviserId || (editingSection as any).adviserTeacherId,
      adviserName: adviser ? `${adviser.firstName} ${adviser.lastName}` : (editingSection.adviserName || 'Assigned Faculty'),
      schoolYear: editingSection.schoolYear || '2025-2026',
      studentCount: editingSection.studentCount || 0,
      status: editingSection.status || 'ACTIVE',
      createdAt: editingSection.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveSection(sectionToSave);
    loadData();
    setIsEditModalOpen(false);
    setEditingSection(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove section "${name}"?`)) {
      storage.deleteSection(id);
      loadData();
      if (inspectSection?.id === id) setInspectSection(null);
    }
  };

  const filteredSections = sections.filter(sec => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = `${sec.name || ''} ${sec.gradeLevel || ''} ${sec.adviserName || ''} ${sec.roomNumber || ''}`
      .toLowerCase()
      .includes(query);
    const matchesGrade = gradeFilter === 'ALL' || sec.gradeLevel === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const enrolledStudentsInSelected = inspectSection
    ? students.filter(
        s =>
          (s.sectionName && inspectSection.name && s.sectionName.toLowerCase() === inspectSection.name.toLowerCase()) ||
          s.sectionId === inspectSection.id
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>Academic Sections & Classes</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Group learners by grade level, assign faculty advisers, and manage classroom rosters.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSection({
              gradeLevel: 'Grade 10',
              schoolYear: '2025-2026',
              maxCapacity: 45,
              roomNumber: 'Rm 204',
              active: true,
            });
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-amber-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Section</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by section name, adviser, or room..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Grade Levels</option>
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 10">Grade 10</option>
          <option value="Grade 11">Grade 11</option>
          <option value="Grade 12">Grade 12</option>
        </select>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map(sec => {
          const sectionStudentsCount = students.filter(
            s => (s.sectionName && sec.name && s.sectionName.toLowerCase() === sec.name.toLowerCase()) || s.sectionId === sec.id
          ).length;
          const capacityPercent = Math.min(100, Math.round((sectionStudentsCount / sec.maxCapacity) * 100));

          return (
            <div
              key={sec.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {sec.gradeLevel}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingSection(sec);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-600 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sec.id, sec.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Section {sec.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sec.roomNumber} • SY {sec.schoolYear}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Class Adviser</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {sec.adviserName}
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] font-medium">Class Enrollment</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                      {sectionStudentsCount} / {sec.maxCapacity} students
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPercent > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setInspectSection(sec)}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  View Enrolled Learners ({sectionStudentsCount})
                </button>
                {onNavigateToPrint && (
                  <button
                    onClick={onNavigateToPrint}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-[11px] font-medium"
                  >
                    Print Batch →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Section Modal */}
      {inspectSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {inspectSection.gradeLevel} - Section {inspectSection.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Adviser: {inspectSection.adviserName} • {enrolledStudentsInSelected.length} Enrolled
                </p>
              </div>
              <button onClick={() => setInspectSection(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2 text-xs">
              {enrolledStudentsInSelected.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No students currently assigned to this section.
                </div>
              ) : (
                enrolledStudentsInSelected.map(stu => (
                  <div
                    key={stu.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={stu.photoUrl} alt="" className="w-8 h-8 rounded-xl object-cover" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {stu.firstName} {stu.lastName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">LRN: {stu.lrn}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectSection(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Section Modal */}
      {isEditModalOpen && editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingSection.id ? 'Edit Section' : 'Create New Section'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Section Name *</label>
                <input
                  type="text"
                  required
                  value={editingSection.name || ''}
                  onChange={e => setEditingSection({ ...editingSection, name: e.target.value })}
                  placeholder="e.g. Einstein, Rizal, Diamond"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Grade Level</label>
                  <select
                    value={editingSection.gradeLevel || 'Grade 10'}
                    onChange={e => setEditingSection({ ...editingSection, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Max Capacity</label>
                  <input
                    type="number"
                    value={editingSection.maxCapacity || 45}
                    onChange={e => setEditingSection({ ...editingSection, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Class Adviser</label>
                <select
                  value={editingSection.adviserTeacherId || ''}
                  onChange={e => {
                    const sel = teachers.find(t => t.id === e.target.value);
                    setEditingSection({
                      ...editingSection,
                      adviserTeacherId: e.target.value,
                      adviserName: sel ? `${sel.firstName} ${sel.lastName}` : '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="">Select Faculty Adviser</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/30"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
