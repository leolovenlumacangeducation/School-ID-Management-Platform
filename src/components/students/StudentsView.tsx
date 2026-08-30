import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Camera,
  Edit2,
  Trash2,
  Eye,
  X,
  Filter,
  Users,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Student, School, IdTemplate, Section } from '../../types';
import { CardPreviewModal } from '../common/CardPreviewModal';
import { PhotoManagerModal } from '../photos/PhotoManagerModal';

interface StudentsViewProps {
  activeSchoolId: string;
  onNavigateToDesigner?: (templateId: string) => void;
  onNavigateToPrint?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  activeSchoolId,
  onNavigateToDesigner,
  onNavigateToPrint,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [templates, setTemplates] = useState<IdTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);

  useEffect(() => {
    loadData();
  }, [activeSchoolId]);

  const loadData = () => {
    setStudents(storage.getStudents(activeSchoolId));
    setSchools(storage.getSchools());
    setSections(storage.getSections(activeSchoolId));
    setTemplates(storage.getTemplates(activeSchoolId));
  };

  const currentSchool = schools.find(s => s.id === activeSchoolId) || schools[0];
  const defaultStudentTemplate = templates.find(t => t.type === 'STUDENT_ID') || templates[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.firstName || !editingStudent?.lastName || !editingStudent?.lrn) return;

    const studentToSave: Student = {
      id: editingStudent.id || `stu-${Date.now()}`,
      schoolId: editingStudent.schoolId || (activeSchoolId !== 'all' ? activeSchoolId : 'sch-1'),
      lrn: editingStudent.lrn,
      firstName: editingStudent.firstName,
      middleName: editingStudent.middleName || '',
      lastName: editingStudent.lastName,
      suffix: editingStudent.suffix || '',
      gender: editingStudent.gender || 'MALE',
      birthdate: (editingStudent as any).birthdate || (editingStudent as any).dateOfBirth || '2008-05-15',
      address: editingStudent.address || 'Metro Manila',
      gradeLevel: editingStudent.gradeLevel || 'Grade 10',
      sectionId: editingStudent.sectionId || 'sec-1',
      guardianName: editingStudent.guardianName || 'Parent / Guardian',
      guardianContact: editingStudent.guardianContact || '+63 917 000 0000',
      photoUrl: editingStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      status: editingStudent.status || 'ACTIVE',
      customFields: {
        bloodType: (editingStudent as any).bloodType || editingStudent.customFields?.bloodType || 'O+',
        rfidNumber: (editingStudent as any).rfidNumber || editingStudent.customFields?.rfidNumber || `RFID-${Math.floor(10000000 + Math.random() * 90000000)}`,
        trackStrand: (editingStudent as any).trackStrand || editingStudent.customFields?.trackStrand || 'STEM',
        emergencyContact: editingStudent.guardianName,
        emergencyNumber: editingStudent.guardianContact,
      },
      verifyHash: editingStudent.verifyHash || `vfy-stu-${Math.random().toString(36).substring(2, 8)}`,
      idCardIssuedAt: editingStudent.idCardIssuedAt || new Date().toISOString(),
      idCardExpiresAt: editingStudent.idCardExpiresAt || new Date(Date.now() + 31536000000).toISOString(),
      createdAt: editingStudent.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveStudent(studentToSave);
    loadData();
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove student record for ${name}?`)) {
      storage.deleteStudent(id);
      loadData();
    }
  };

  const handleExportCsv = () => {
    const headers = ['LRN', 'Student No', 'First Name', 'Last Name', 'Grade Level', 'Section', 'School Year', 'Guardian', 'Contact', 'RFID'];
    const rows = students.map(s => [
      s.lrn,
      s.studentNo,
      s.firstName,
      s.lastName,
      s.gradeLevel,
      s.sectionName,
      s.schoolYear,
      s.guardianName,
      s.guardianContact,
      s.rfidNumber || 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredStudents = students.filter(s => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = `${s.firstName || ''} ${s.lastName || ''} ${s.lrn || ''} ${s.studentNo || ''} ${s.sectionName || ''} ${s.guardianName || ''}`
      .toLowerCase()
      .includes(query);
    const matchesGrade = gradeFilter === 'ALL' || s.gradeLevel === gradeFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Student & Learner Roster</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage 12-digit DepEd LRNs, grade sections, guardian contacts, and RFID security identifiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-blue-500" />
            <span>Bulk Photo Match</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingStudent({
                lrn: `109${Math.floor(100000000 + Math.random() * 900000000)}`,
                studentNo: `STU-2025-${Math.floor(1000 + Math.random() * 9000)}`,
                gradeLevel: 'Grade 10',
                sectionName: 'Einstein',
                schoolYear: '2025-2026',
                status: 'ACTIVE',
                bloodType: 'O+',
                rfidNumber: `RFID-${Math.floor(10000000 + Math.random() * 90000000)}`,
              });
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, 12-digit LRN, section, guardian, or RFID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
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

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="GRADUATED">Graduated</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="DROPPED">Dropped</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Students Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Student & 12-Digit LRN</th>
                <th className="px-6 py-3.5">Grade & Section</th>
                <th className="px-6 py-3.5">Emergency Contact</th>
                <th className="px-6 py-3.5">Blood / RFID</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Card Preview & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={student.photoUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {student.firstName} {student.lastName} {student.suffix}
                        </div>
                        <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          LRN: {student.lrn}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {student.gradeLevel} - {student.sectionName}
                    </div>
                    <div className="text-[10px] text-slate-400">SY {student.schoolYear} • {student.trackStrand || 'Junior High'}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                    <div className="font-medium">{student.guardianName}</div>
                    <div className="text-[10px] text-slate-400">{student.guardianContact}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                        {student.bloodType || 'O+'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {student.rfidNumber || 'No RFID'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => setPreviewStudent(student)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      Preview ID
                    </button>
                    <button
                      onClick={() => {
                        setEditingStudent(student);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Student Modal */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingStudent.id ? 'Edit Student Record' : 'Register New Student'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">12-Digit LRN *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={editingStudent.lrn || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, lrn: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.firstName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.lastName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Grade Level</label>
                  <select
                    value={editingStudent.gradeLevel || 'Grade 10'}
                    onChange={e => setEditingStudent({ ...editingStudent, gradeLevel: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
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
                  <label className="font-bold text-slate-700 dark:text-slate-300">Section Name</label>
                  <input
                    type="text"
                    value={editingStudent.sectionName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, sectionName: e.target.value })}
                    placeholder="e.g. Einstein"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Blood Type</label>
                  <select
                    value={editingStudent.bloodType || 'O+'}
                    onChange={e => setEditingStudent({ ...editingStudent, bloodType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={editingStudent.guardianName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, guardianName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Guardian Contact Number</label>
                  <input
                    type="text"
                    value={editingStudent.guardianContact || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, guardianContact: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">RFID / Smart Card UID</label>
                  <input
                    type="text"
                    value={editingStudent.rfidNumber || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, rfidNumber: e.target.value })}
                    placeholder="RFID-10492810"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Photo URL</label>
                  <input
                    type="url"
                    value={editingStudent.photoUrl || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, photoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single ID Card Live Preview Modal */}
      {previewStudent && defaultStudentTemplate && (
        <CardPreviewModal
          isOpen={true}
          onClose={() => setPreviewStudent(null)}
          record={previewStudent}
          school={currentSchool}
          template={defaultStudentTemplate}
          onNavigateToDesigner={onNavigateToDesigner}
          onPrintSingle={onNavigateToPrint}
        />
      )}

      {/* Photo Bulk Upload Modal */}
      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        targetType="STUDENT"
        schoolId={activeSchoolId}
        onPhotosUpdated={loadData}
      />
    </div>
  );
};
