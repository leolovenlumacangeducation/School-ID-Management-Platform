import React from 'react';
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  FolderKanban,
  LayoutTemplate,
  Image as ImageIcon,
  Printer,
  ShieldCheck,
  History,
  UserCheck,
  Settings,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onSelectModule: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    schools: number;
    teachers: number;
    students: number;
    sections: number;
    templates: number;
    assets: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  collapsed,
  counts,
}) => {
  const navigationGroups = [
    {
      group: 'Core Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: undefined,
        },
        {
          id: 'schools',
          label: 'Schools',
          icon: School,
          badge: counts.schools,
        },
        {
          id: 'teachers',
          label: 'Teacher IDs',
          icon: Users,
          badge: counts.teachers,
        },
        {
          id: 'students',
          label: 'Student IDs',
          icon: GraduationCap,
          badge: counts.students,
        },
        {
          id: 'sections',
          label: 'Sections',
          icon: FolderKanban,
          badge: counts.sections,
        },
      ],
    },
    {
      group: 'Design & Production',
      items: [
        {
          id: 'templates',
          label: 'ID Templates',
          icon: LayoutTemplate,
          badge: counts.templates,
        },
        {
          id: 'designer',
          label: 'ID Designer',
          icon: Sparkles,
          isHighlight: true,
        },
        {
          id: 'assets',
          label: 'Asset Library',
          icon: ImageIcon,
          badge: counts.assets,
        },
        {
          id: 'print',
          label: 'Print Center',
          icon: Printer,
          badge: 'Batch',
        },
      ],
    },
    {
      group: 'Security & Admin',
      items: [
        {
          id: 'verify',
          label: 'Verification Portal',
          icon: ShieldCheck,
          badge: 'Live',
        },
        {
          id: 'audit',
          label: 'Audit Logs',
          icon: History,
        },
        {
          id: 'users',
          label: 'User Management',
          icon: UserCheck,
        },
        {
          id: 'settings',
          label: 'Settings & Backups',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0F1115] border-r border-[#1F2128] transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#1F2128] justify-between">
        <div className="flex items-center space-x-3 overflow-hidden cursor-pointer" onClick={() => onSelectModule('dashboard')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <div className="font-extrabold text-sm tracking-tight text-[#E0E0E3] flex items-center gap-1.5">
                SchoolID <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-[#1F2128] text-indigo-400 border border-indigo-500/30 rounded">CR80</span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium truncate">
                Multi-Tenant Cloud
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navigationGroups.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = activeModule === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2'
                    } rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? item.isHighlight
                          ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]'
                          : 'bg-[#1F2128] text-indigo-400 border border-indigo-500/30'
                        : item.isHighlight
                        ? 'text-indigo-400 bg-[#1F2128]/70 hover:bg-[#1F2128] border border-transparent hover:border-[#2D3038]'
                        : 'text-gray-400 hover:text-[#E0E0E3] hover:bg-[#1F2128]/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-white'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-[#1F2128] text-gray-400 border border-[#2D3038]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Status Footbar */}
      {!collapsed && (
        <div className="p-3 border-t border-[#1F2128]">
          <div className="p-2.5 rounded-lg bg-[#15171E] border border-[#1F2128] text-[11px] space-y-1">
            <div className="flex items-center justify-between text-[#E0E0E3] font-semibold">
              <span>Security Core</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                99.98%
              </span>
            </div>
            <div className="text-gray-500 text-[10px] flex justify-between items-center font-mono">
              <span>CR80 Engine</span>
              <span>v3.4.0 PROD</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
