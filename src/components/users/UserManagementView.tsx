import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  X,
  Lock,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { User, UserRole, School } from '../../types';

interface UserManagementViewProps {
  currentUser: User;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    setUsers(storage.getUsers());
    setSchools(storage.getSchools());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.name || !editingUser?.email) return;

    const userToSave: User = {
      id: editingUser.id || `usr-${Date.now()}`,
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role || 'SCHOOL_ADMIN',
      schoolId: editingUser.schoolId,
      active: (editingUser as any).active ?? true,
      avatarUrl: editingUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: editingUser.createdAt || new Date().toISOString(),
    };

    storage.saveUser(userToSave);
    setUsers(storage.getUsers());
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove user account "${name}"?`)) {
      storage.deleteUser(id);
      setUsers(storage.getUsers());
    }
  };

  const permissionsMatrix = [
    { module: 'Multi-School SaaS Management', super: true, school: false, op: false, view: false },
    { module: 'Create & Edit School Profiles', super: true, school: true, op: false, view: false },
    { module: 'Manage Student & Teacher Rosters', super: true, school: true, op: true, view: false },
    { module: 'Launch ID Designer & Customize Layouts', super: true, school: true, op: true, view: false },
    { module: 'Bulk PDF Print Sheet Generation', super: true, school: true, op: true, view: false },
    { module: 'Bulk Photo Matcher & Cropper', super: true, school: true, op: true, view: false },
    { module: 'QR Code Verification & Guard Scanner', super: true, school: true, op: true, view: true },
    { module: 'Audit Logs Inspection & CSV Export', super: true, school: true, op: false, view: false },
    { module: 'System Backup, Restore & Database Reset', super: true, school: false, op: false, view: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>User Accounts & RBAC Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-tenant administrative roles, operator credentials, and module permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser({
              role: 'SCHOOL_ADMIN',
              status: 'ACTIVE',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            });
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-6 py-3.5">User & Profile</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Assigned RBAC Role</th>
                <th className="px-6 py-3.5">School Scope</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {(u.role || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                    {u.schoolId ? schools.find(s => s.id === u.schoolId)?.name || u.schoolId : 'Global (All Schools)'}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    }`}>
                      {u.active ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-1">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permissions Breakdown Matrix */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Role-Based Access Control (RBAC) Permissions Matrix</span>
          </h3>
          <p className="text-xs text-slate-400">
            Enforced authorization capabilities by user role.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Platform Capability</th>
                <th className="px-4 py-3 text-center">Super Admin</th>
                <th className="px-4 py-3 text-center">School Admin</th>
                <th className="px-4 py-3 text-center">Operator</th>
                <th className="px-4 py-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {item.module}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.super ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.school ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.op ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.view ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingUser.id ? 'Edit User Record' : 'Provision User Account'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingUser.name || ''}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="e.g. admin@school.edu"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">RBAC Role</label>
                <select
                  value={editingUser.role || 'SCHOOL_ADMIN'}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="SUPER_ADMIN">Super Administrator (Global Root)</option>
                  <option value="SCHOOL_ADMIN">School Administrator</option>
                  <option value="OPERATOR">Print & ID Operator</option>
                  <option value="VIEWER">Public / Guard Viewer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">School Tenant Scope</label>
                <select
                  value={editingUser.schoolId || ''}
                  onChange={e => setEditingUser({ ...editingUser, schoolId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="">Global (All Tenants)</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
