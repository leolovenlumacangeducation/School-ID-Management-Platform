import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Download,
  Filter,
  Eye,
  X,
  Shield,
  FileJson,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { AuditLog } from '../../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setLogs(storage.getAuditLogs());
  }, []);

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      l.timestamp,
      l.userName,
      l.action,
      l.entityType,
      l.entityId,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ipAddress,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = `${l.userName || ''} ${l.action || ''} ${l.details || ''} ${l.entityType || ''} ${l.ipAddress || ''}`
      .toLowerCase()
      .includes((searchQuery || '').toLowerCase());
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const actions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Compliance & Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit logs capturing user actions, template edits, batch print jobs, and QR scanner verification events.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1.5 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, action, details, IP address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="ALL">All Event Actions</option>
          {actions.map(act => (
            <option key={act} value={act}>{act}</option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Entity & Details</th>
                <th className="px-6 py-3.5 font-mono">IP Address</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    {log.userName}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">
                    <div className="line-clamp-1">{log.details}</div>
                    <div className="text-[10px] font-mono text-slate-400">{log.entityType} ({log.entityId})</div>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px]"
                    >
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileJson className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Audit Log Record Schema</span>
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl overflow-x-auto">
              <pre className="font-mono text-emerald-400 text-xs leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
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
