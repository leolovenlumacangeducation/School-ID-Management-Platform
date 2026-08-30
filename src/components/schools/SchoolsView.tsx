import React, { useState, useEffect } from 'react';
import {
  School as SchoolIcon,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Archive,
  ExternalLink,
  Users,
  GraduationCap,
  FolderKanban,
  LayoutTemplate,
  Mail,
  Phone,
  Globe,
  MapPin,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { School } from '../../types';

export const SchoolsView: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<Partial<School> | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = () => {
    setSchools(storage.getSchools());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool?.name || !editingSchool?.schoolId) return;

    const schoolToSave: School = {
      id: editingSchool.id || `sch-${Date.now()}`,
      schoolId: editingSchool.schoolId,
      name: editingSchool.name,
      address: editingSchool.address || 'Metro Manila, Philippines',
      district: editingSchool.district || 'District 1',
      division: editingSchool.division || 'Division of City Schools',
      region: editingSchool.region || 'NCR',
      principalName: editingSchool.principalName || 'Principal Name',
      schoolEmail: editingSchool.schoolEmail || 'contact@school.edu',
      contactNumber: editingSchool.contactNumber || '+63 2 8000 0000',
      website: editingSchool.website || 'https://school.edu',
      logoUrl: editingSchool.logoUrl || 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=200&auto=format&fit=crop&q=80',
      sealUrl: editingSchool.sealUrl || 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=200&auto=format&fit=crop&q=80',
      active: editingSchool.active ?? true,
      status: editingSchool.status || 'ACTIVE',
      createdAt: editingSchool.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: editingSchool.stats || {
        teachersCount: 30,
        studentsCount: 950,
        sectionsCount: 20,
        templatesCount: 2,
        printedCount: 890,
      },
    };

    storage.saveSchool(schoolToSave);
    loadSchools();
    setIsModalOpen(false);
    setEditingSchool(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}"? All associated templates and configurations will be removed.`)) {
      storage.deleteSchool(id);
      loadSchools();
      if (selectedSchool?.id === id) setSelectedSchool(null);
    }
  };

  const handleToggleStatus = (school: School) => {
    const nextStatus = school.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    storage.saveSchool({
      ...school,
      status: nextStatus,
      active: nextStatus === 'ACTIVE',
    });
    loadSchools();
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(schools, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `schools_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredSchools = schools.filter(s => {
    const matchesSearch = `${s.name || ''} ${s.schoolId || ''} ${s.district || ''} ${s.division || ''} ${s.principalName || ''}`
      .toLowerCase()
      .includes((searchQuery || '').toLowerCase());
    const matchesRegion = regionFilter === 'ALL' || s.region === regionFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const uniqueRegions = Array.from(new Set(schools.map(s => s.region)));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SchoolIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>School Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision, customize, and oversee multi-tenant educational institutions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => {
              setEditingSchool({
                name: '',
                schoolId: `SCH-${Math.floor(100000 + Math.random() * 900000)}`,
                region: 'National Capital Region (NCR)',
                division: 'Division of City Schools',
                district: 'District 1',
                active: true,
                status: 'ACTIVE',
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New School</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by school name, ID, division, or principal..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Regions</option>
            {uniqueRegions.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map(school => (
            <div
              key={school.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div className="p-6 space-y-4">
                {/* Card Top: Logo & Badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={school.logoUrl}
                      alt={school.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-2xs"
                    />
                    <div>
                      <div className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {school.schoolId}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        school.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {school.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingSchool(school);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                      title="Edit school"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(school.id, school.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                      title="Delete school"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* School Name & Location */}
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                    {school.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{school.division} • {school.region}</span>
                  </p>
                </div>

                {/* Principal & Contact */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5">
                  <div className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                    Principal: {school.principalName}
                  </div>
                  <div className="text-slate-400 flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{school.schoolEmail}</span>
                  </div>
                </div>

                {/* Micro Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="font-black text-slate-900 dark:text-white">
                      {school.stats?.studentsCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Students</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="font-black text-slate-900 dark:text-white">
                      {school.stats?.teachersCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Teachers</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="font-black text-slate-900 dark:text-white">
                      {school.stats?.templatesCount || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Templates</div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                <button
                  onClick={() => handleToggleStatus(school)}
                  className={`text-[11px] font-bold ${
                    school.status === 'ACTIVE'
                      ? 'text-amber-600 hover:text-amber-700'
                      : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {school.status === 'ACTIVE' ? 'Deactivate School' : 'Activate School'}
                </button>
                <button
                  onClick={() => setSelectedSchool(school)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">School Name & ID</th>
                  <th className="px-6 py-3.5">Region / Division</th>
                  <th className="px-6 py-3.5">Principal</th>
                  <th className="px-6 py-3.5 text-center">Headcount</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSchools.map(school => (
                  <tr key={school.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={school.logoUrl}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {school.name}
                          </div>
                          <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {school.schoolId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div>{school.division}</div>
                      <div className="text-[10px] text-slate-400">{school.region}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {school.principalName}
                      </div>
                      <div className="text-[10px] text-slate-400">{school.schoolEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {school.stats?.studentsCount || 0}
                      </span>
                      <span className="text-slate-400 text-[10px]"> stu / </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {school.stats?.teachersCount || 0}
                      </span>
                      <span className="text-slate-400 text-[10px]"> tch</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        school.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                      }`}>
                        {school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSchool(school)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => {
                          setEditingSchool(school);
                          setIsModalOpen(true);
                        }}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit School Modal */}
      {isModalOpen && editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingSchool.id ? 'Edit School Details' : 'Provision New School'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">School Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSchool.name || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, name: e.target.value })}
                    placeholder="e.g. St. Augustine Science Academy"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Official School ID / DepEd Code *</label>
                  <input
                    type="text"
                    required
                    value={editingSchool.schoolId || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, schoolId: e.target.value })}
                    placeholder="e.g. SCH-301928"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Region</label>
                  <input
                    type="text"
                    value={editingSchool.region || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, region: e.target.value })}
                    placeholder="e.g. National Capital Region (NCR)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Division</label>
                  <input
                    type="text"
                    value={editingSchool.division || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, division: e.target.value })}
                    placeholder="e.g. Division of Manila"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Principal / Head Name</label>
                  <input
                    type="text"
                    value={editingSchool.principalName || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, principalName: e.target.value })}
                    placeholder="e.g. Dr. Maria Elena Santos, Ph.D."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Official Email</label>
                  <input
                    type="email"
                    value={editingSchool.schoolEmail || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, schoolEmail: e.target.value })}
                    placeholder="e.g. admin@school.edu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Campus Address</label>
                  <input
                    type="text"
                    value={editingSchool.address || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })}
                    placeholder="e.g. 742 Academic Parkway, Manila"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Logo URL</label>
                  <input
                    type="url"
                    value={editingSchool.logoUrl || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Seal / Stamp URL</label>
                  <input
                    type="url"
                    value={editingSchool.sealUrl || ''}
                    onChange={e => setEditingSchool({ ...editingSchool, sealUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  Save School Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* School Details Drawer / Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedSchool.logoUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-indigo-500/20"
                />
                <div>
                  <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedSchool.schoolId}
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {selectedSchool.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {selectedSchool.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSchool(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Region & Division</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedSchool.division}
                </p>
                <p className="text-[11px] text-slate-500">{selectedSchool.region}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Authorized Head</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedSchool.principalName}
                </p>
                <p className="text-[11px] text-slate-500">Principal / Registrar</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Contact Details</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedSchool.contactNumber}</p>
                <p className="text-[11px] text-slate-500 truncate">{selectedSchool.schoolEmail}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Physical Address</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{selectedSchool.address}</p>
                <p className="text-[11px] text-slate-500">{selectedSchool.district}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedSchool(null)}
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
