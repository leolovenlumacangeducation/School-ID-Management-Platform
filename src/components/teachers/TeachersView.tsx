import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  Camera,
  QrCode,
  Shield,
  FileSpreadsheet,
  X,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Teacher, School, IdTemplate } from '../../types';
import { CardPreviewModal } from '../common/CardPreviewModal';
import { PhotoManagerModal } from '../photos/PhotoManagerModal';

interface TeachersViewProps {
  activeSchoolId: string;
  onNavigateToDesigner?: (templateId: string) => void;
  onNavigateToPrint?: () => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  activeSchoolId,
  onNavigateToDesigner,
  onNavigateToPrint,
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [templates, setTemplates] = useState<IdTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [previewTeacher, setPreviewTeacher] = useState<Teacher | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Partial<Teacher> | null>(null);

  useEffect(() => {
    loadData();
  }, [activeSchoolId]);

  const loadData = () => {
    setTeachers(storage.getTeachers(activeSchoolId));
    setSchools(storage.getSchools());
    setTemplates(storage.getTemplates(activeSchoolId));
  };

  const currentSchool = schools.find(s => s.id === activeSchoolId) || schools[0];
  const defaultTeacherTemplate = templates.find(t => t.type === 'TEACHER_ID') || templates[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher?.firstName || !editingTeacher?.lastName || !editingTeacher?.employeeNo) return;

    const teacherToSave: Teacher = {
      id: editingTeacher.id || `tch-${Date.now()}`,
      schoolId: editingTeacher.schoolId || (activeSchoolId !== 'all' ? activeSchoolId : 'sch-1'),
      employeeNo: editingTeacher.employeeNo,
      firstName: editingTeacher.firstName,
      middleName: editingTeacher.middleName || '',
      lastName: editingTeacher.lastName,
      suffix: editingTeacher.suffix || '',
      gender: editingTeacher.gender || 'MALE',
      dateOfBirth: editingTeacher.dateOfBirth || '1990-01-01',
      address: editingTeacher.address || 'Metro Manila',
      position: editingTeacher.position || 'Instructor',
      department: editingTeacher.department || 'Science & Technology',
      email: editingTeacher.email || 'teacher@school.edu',
      contactNumber: editingTeacher.contactNumber || '+63 917 000 0000',
      photoUrl: editingTeacher.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      signatureUrl: editingTeacher.signatureUrl || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&auto=format&fit=crop&q=80',
      dateHired: editingTeacher.dateHired || '2023-08-01',
      status: editingTeacher.status || 'ACTIVE',
      customFields: editingTeacher.customFields || {
        bloodType: 'O+',
        tin: '000-000-000-000',
        emergencyContact: 'Emergency Contact',
        emergencyNumber: '+63 917 000 0000',
        rfidNumber: `RFID-${Math.floor(10000000 + Math.random() * 90000000)}`,
      },
      verifyHash: editingTeacher.verifyHash || `vfy-tch-${Math.random().toString(36).substring(2, 8)}`,
      idCardIssuedAt: editingTeacher.idCardIssuedAt || new Date().toISOString(),
      idCardExpiresAt: editingTeacher.idCardExpiresAt || new Date(Date.now() + 63072000000).toISOString(),
      createdAt: editingTeacher.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveTeacher(teacherToSave);
    loadData();
    setIsEditModalOpen(false);
    setEditingTeacher(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove teacher record for ${name}?`)) {
      storage.deleteTeacher(id);
      loadData();
    }
  };

  const handleExportCsv = () => {
    const headers = ['Employee No', 'First Name', 'Last Name', 'Position', 'Department', 'Email', 'Contact', 'Blood Type', 'RFID Number'];
    const rows = teachers.map(t => [
      t.employeeNo,
      t.firstName,
      t.lastName,
      t.position,
      t.department,
      t.email,
      t.contactNumber,
      t.customFields.bloodType || 'O+',
      t.customFields.rfidNumber || 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `teachers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const departments = Array.from(new Set(teachers.map(t => t.department)));

  const filteredTeachers = teachers.filter(t => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = `${t.firstName || ''} ${t.lastName || ''} ${t.employeeNo || ''} ${t.email || ''} ${t.position || ''}`
      .toLowerCase()
      .includes(query);
    const matchesDept = departmentFilter === 'ALL' || t.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span>Teacher & Faculty ID Roster</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage faculty records, government compliance IDs, RFID access keys, and credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-rose-500" />
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
              setEditingTeacher({
                employeeNo: `EMP-2025-${Math.floor(1000 + Math.random() * 9000)}`,
                gender: 'MALE',
                status: 'ACTIVE',
                customFields: { bloodType: 'O+', rfidNumber: `RFID-${Math.floor(10000000 + Math.random() * 90000000)}` },
              });
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-rose-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teacher Record</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee #, position, email, or RFID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="RESIGNED">Resigned</option>
        </select>
      </div>

      {/* Teachers Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Teacher & ID</th>
                <th className="px-6 py-3.5">Position & Department</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Custom & RFID</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Card Preview & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={teacher.photoUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {teacher.firstName} {teacher.lastName} {teacher.suffix}
                        </div>
                        <div className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                          {teacher.employeeNo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {teacher.position}
                    </div>
                    <div className="text-[10px] text-slate-400">{teacher.department}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                    <div>{teacher.email}</div>
                    <div className="text-[10px] text-slate-400">{teacher.contactNumber}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                        {teacher.customFields.bloodType || 'O+'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {teacher.customFields.rfidNumber || 'No RFID'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => setPreviewTeacher(teacher)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      Preview ID
                    </button>
                    <button
                      onClick={() => {
                        setEditingTeacher(teacher);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
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

      {/* Edit / Add Teacher Modal */}
      {isEditModalOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingTeacher.id ? 'Edit Teacher Record' : 'Register New Faculty Member'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Employee # *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.employeeNo || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, employeeNo: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.firstName || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.lastName || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Position / Title</label>
                  <input
                    type="text"
                    value={editingTeacher.position || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, position: e.target.value })}
                    placeholder="e.g. Master Teacher II"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Department</label>
                  <input
                    type="text"
                    value={editingTeacher.department || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
                    placeholder="e.g. Science & Technology"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Blood Type</label>
                  <select
                    value={editingTeacher.customFields?.bloodType || 'O+'}
                    onChange={e => setEditingTeacher({
                      ...editingTeacher,
                      customFields: { ...editingTeacher.customFields, bloodType: e.target.value }
                    })}
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
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={editingTeacher.email || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contact Number</label>
                  <input
                    type="text"
                    value={editingTeacher.contactNumber || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, contactNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">RFID / Smart Card UID</label>
                  <input
                    type="text"
                    value={editingTeacher.customFields?.rfidNumber || ''}
                    onChange={e => setEditingTeacher({
                      ...editingTeacher,
                      customFields: { ...editingTeacher.customFields, rfidNumber: e.target.value }
                    })}
                    placeholder="RFID-984210492"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Photo URL</label>
                  <input
                    type="url"
                    value={editingTeacher.photoUrl || ''}
                    onChange={e => setEditingTeacher({ ...editingTeacher, photoUrl: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/30"
                >
                  Save Teacher Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single ID Card Live Preview Modal */}
      {previewTeacher && defaultTeacherTemplate && (
        <CardPreviewModal
          isOpen={true}
          onClose={() => setPreviewTeacher(null)}
          record={previewTeacher}
          school={currentSchool}
          template={defaultTeacherTemplate}
          onNavigateToDesigner={onNavigateToDesigner}
          onPrintSingle={onNavigateToPrint}
        />
      )}

      {/* Photo Bulk Upload Modal */}
      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        targetType="TEACHER"
        schoolId={activeSchoolId}
        onPhotosUpdated={loadData}
      />
    </div>
  );
};
