import React, { useState, useEffect } from 'react';
import {
  School,
  Users,
  GraduationCap,
  FolderKanban,
  Sparkles,
  Printer,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  FileCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { storage } from '../../services/storageService';
import { AuditLog } from '../../types';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
  activeSchoolId: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, activeSchoolId }) => {
  const [schools, setSchools] = useState(storage.getSchools());
  const [teachers, setTeachers] = useState(storage.getTeachers(activeSchoolId));
  const [students, setStudents] = useState(storage.getStudents(activeSchoolId));
  const [sections, setSections] = useState(storage.getSections(activeSchoolId));
  const [templates, setTemplates] = useState(storage.getTemplates(activeSchoolId));
  const [logs, setLogs] = useState<AuditLog[]>(storage.getAuditLogs().slice(0, 7));

  useEffect(() => {
    setSchools(storage.getSchools());
    setTeachers(storage.getTeachers(activeSchoolId));
    setStudents(storage.getStudents(activeSchoolId));
    setSections(storage.getSections(activeSchoolId));
    setTemplates(storage.getTemplates(activeSchoolId));
    setLogs(storage.getAuditLogs().slice(0, 7));
  }, [activeSchoolId]);

  // Aggregate stats
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === 'ACTIVE').length;
  const totalTeachers = teachers.length;
  const totalStudents = students.length;
  const totalSections = sections.length;
  const totalGenerated = totalStudents + totalTeachers;
  const totalPrinted = Math.round(totalGenerated * 0.94);

  // Charts dataset
  const schoolDistributionData = schools.map(s => ({
    name: s.name.length > 18 ? s.name.substring(0, 18) + '...' : s.name,
    teachers: s.stats?.teachersCount || 40,
    students: s.stats?.studentsCount || 1200,
  }));

  const monthlyGenerationData = [
    { month: 'Jan', generated: 450, printed: 410 },
    { month: 'Feb', generated: 820, printed: 790 },
    { month: 'Mar', generated: 1100, printed: 1050 },
    { month: 'Apr', generated: 920, printed: 890 },
    { month: 'May', generated: 1450, printed: 1380 },
    { month: 'Jun', generated: 3800, printed: 3620 },
    { month: 'Jul', generated: 4200, printed: 4050 },
    { month: 'Aug', generated: 4890, printed: 4710 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#0F1115] via-[#15171E] to-[#0F1115] text-[#E0E0E3] p-6 rounded-2xl border border-[#1F2128] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Multi-School ID Engine Active</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Enterprise ID Operations & Design Studio
          </h1>
          <p className="text-gray-400 text-xs max-w-2xl">
            Design CR80 smart ID cards, manage student & teacher rosters, execute bulk print sheets with cut marks, and verify secure QR credentials.
          </p>
        </div>

        {/* Quick Launcher Action Buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('designer')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>New ID Design</span>
          </button>
          <button
            onClick={() => onNavigate('print')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#1F2128] border border-[#2D3038] hover:bg-[#252832] text-gray-200 font-semibold text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Batch Print Center</span>
          </button>
          <button
            onClick={() => onNavigate('verify')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#1F2128] border border-[#2D3038] hover:bg-[#252832] text-gray-200 font-semibold text-xs transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Scanner</span>
          </button>
        </div>
      </div>

      {/* Dashboard KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="bg-[#0F1115] p-4 rounded-xl border border-[#1F2128] hover:border-[#2D3038] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Schools</span>
            <School className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {totalSchools}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>{activeSchools} Active Tenants</span>
          </div>
        </div>

        <div className="bg-[#0F1115] p-4 rounded-xl border border-[#1F2128] hover:border-[#2D3038] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Schools</span>
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {activeSchools}
          </div>
          <div className="text-[10px] text-gray-500">
            100% Operational
          </div>
        </div>

        <div className="bg-[#0F1115] p-4 rounded-xl border border-[#1F2128] hover:border-[#2D3038] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Teachers</span>
            <Users className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {totalTeachers.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">
            Faculty & Staff
          </div>
        </div>

        <div className="bg-[#0F1115] p-4 rounded-xl border border-[#1F2128] hover:border-[#2D3038] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Students</span>
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {totalStudents.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">
            Enrolled Learners
          </div>
        </div>

        <div className="bg-[#0F1115] p-4 rounded-xl border border-[#1F2128] hover:border-[#2D3038] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Sections</span>
            <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {totalSections}
          </div>
          <div className="text-[10px] text-gray-500">
            Grade 7 - 12
          </div>
        </div>

        <div className="bg-[#0F1115] p-4 rounded-xl border border-[#1F2128] hover:border-[#2D3038] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Generated IDs</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {totalGenerated.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold">
            Ready in System
          </div>
        </div>

        <div className="bg-[#0F1115] p-4 rounded-xl border border-[#1F2128] hover:border-[#2D3038] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Printed</span>
            <Printer className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {totalPrinted.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500">
            94% Print Output
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Generation & Print Stats */}
        <div className="bg-[#0F1115] p-5 rounded-xl border border-[#1F2128]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">
                Monthly ID Generations & Printing
              </h3>
              <p className="text-xs text-gray-500">
                Digital generation vs physical sheet output
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Generated
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> Printed
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyGenerationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPrint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2128" opacity={0.8} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#15171E',
                    borderRadius: '8px',
                    color: '#E0E0E3',
                    border: '1px solid #2D3038',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="generated" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorGen)" />
                <Area type="monotone" dataKey="printed" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorPrint)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Teachers and Students per School */}
        <div className="bg-[#0F1115] p-5 rounded-xl border border-[#1F2128]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">
                Learner & Faculty Headcount per School
              </h3>
              <p className="text-xs text-gray-500">
                Multi-tenant distribution across registered institutions
              </p>
            </div>
            <button
              onClick={() => onNavigate('schools')}
              className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Schools</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2128" opacity={0.8} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#15171E',
                    borderRadius: '8px',
                    color: '#E0E0E3',
                    border: '1px solid #2D3038',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Students" />
                <Bar dataKey="teachers" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Teachers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity Feed & Active Templates Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Trail Feed */}
        <div className="lg:col-span-2 bg-[#0F1115] p-5 rounded-xl border border-[#1F2128]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">
                Live Audit & Activity Trail
              </h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {logs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-[#15171E] border border-[#1F2128] flex items-start justify-between text-xs transition-colors hover:border-[#2D3038]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-200">
                      {log.userName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1F2128] text-indigo-300 border border-indigo-500/30 font-mono">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    {log.details}
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">
                  {log.ipAddress}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ready ID Templates Quick Launch */}
        <div className="bg-[#0F1115] p-5 rounded-xl border border-[#1F2128] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white">
                Active ID Templates
              </h3>
              <button
                onClick={() => onNavigate('templates')}
                className="text-xs text-indigo-400 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {templates.slice(0, 3).map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => onNavigate('designer')}
                  className="p-3 rounded-lg border border-[#1F2128] hover:border-indigo-500/50 cursor-pointer transition-all bg-[#15171E] group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-gray-200 group-hover:text-indigo-400 transition-colors">
                      {tpl.name}
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#1F2128] text-gray-400 border border-[#2D3038]">
                      v{tpl.version}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                    <span>{(tpl.type || '').replace('_', ' ')} • {tpl.orientation}</span>
                    <span className="text-indigo-400 font-medium group-hover:underline">
                      Edit in Studio →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('designer')}
            className="w-full mt-4 py-2.5 rounded-lg bg-[#1F2128] text-indigo-400 font-semibold text-xs hover:bg-[#252832] transition-colors flex items-center justify-center space-x-2 border border-indigo-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Template in Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
