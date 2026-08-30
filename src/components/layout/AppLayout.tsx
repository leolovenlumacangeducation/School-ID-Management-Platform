import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  School as SchoolIcon,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Printer,
  Shield,
  User,
  CheckCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { storage } from '../../services/storageService';
import { School, UserRole, User as UserType, NavigationTab } from '../../types';

interface AppLayoutProps {
  activeTab?: NavigationTab;
  setActiveTab?: (tab: NavigationTab) => void;
  activeModule?: string;
  onSelectModule?: (module: string) => void;
  children: React.ReactNode;
  activeSchoolId: string;
  setActiveSchoolId?: (schoolId: string) => void;
  onSelectSchool?: (schoolId: string) => void;
  currentUser: UserType;
  setCurrentUser?: (user: UserType) => void;
  onSwitchRole?: (role: UserRole) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
  onToggleDarkMode?: () => void;
  onOpenCommandPalette?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  activeModule,
  onSelectModule,
  children,
  activeSchoolId,
  setActiveSchoolId,
  onSelectSchool,
  currentUser,
  setCurrentUser,
  onSwitchRole,
  isDarkMode = true,
  setIsDarkMode,
  onToggleDarkMode,
  onOpenCommandPalette,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentTab = (activeTab || activeModule || 'dashboard') as NavigationTab;

  const handleSelectTab = (tab: string) => {
    if (setActiveTab) setActiveTab(tab as NavigationTab);
    if (onSelectModule) onSelectModule(tab);
  };

  const handleSelectSchool = (schoolId: string) => {
    if (setActiveSchoolId) setActiveSchoolId(schoolId);
    if (onSelectSchool) onSelectSchool(schoolId);
  };

  const handleSwitchRole = (role: UserRole) => {
    if (onSwitchRole) onSwitchRole(role);
    if (setCurrentUser && currentUser) {
      const updatedUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
      storage.setCurrentUser(updatedUser);
    }
  };

  const handleOpenPalette = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else {
      setCommandPaletteOpen(true);
    }
  };

  useEffect(() => {
    setSchools(storage.getSchools());
  }, [activeSchoolId]);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSchool = schools.find(s => s.id === activeSchoolId);

  const counts = {
    schools: storage.getSchools().length,
    teachers: storage.getTeachers('all').length,
    students: storage.getStudents('all').length,
    sections: storage.getSections('all').length,
    templates: storage.getTemplates('all').length,
    assets: storage.getAssets('all').length,
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Administrator', desc: 'Full root access to all schools, templates, and backups' },
    { role: 'SCHOOL_ADMIN', label: 'School Administrator', desc: 'Manage teachers, students, sections, and school templates' },
    { role: 'OPERATOR', label: 'Print & ID Operator', desc: 'Design IDs, run batch print jobs, and match student photos' },
    { role: 'VIEWER', label: 'Public & Audit Viewer', desc: 'Read-only access, verification scanner, and log views' },
  ];

  return (
    <div className={`min-h-screen bg-[#0A0B0E] text-[#E0E0E3] flex ${isDarkMode ? 'dark' : ''} font-sans`}>
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={module => handleSelectTab(module)}
      />

      {/* Persistent Enterprise Sidebar */}
      <Sidebar
        activeModule={currentTab}
        onSelectModule={handleSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        counts={counts}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-14 bg-[#0F1115] border-b border-[#1F2128] px-6 flex items-center justify-between shrink-0">
          {/* Left: Sidebar Toggle & School Selector & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2128] transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-[#2D3038]" />

            {/* School Selector Dropdown */}
            <div className="flex items-center space-x-2 bg-[#1F2128] px-2.5 py-1 rounded-lg border border-[#2D3038]">
              <SchoolIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={activeSchoolId}
                onChange={e => handleSelectSchool(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-[#E0E0E3] cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#0F1115] text-[#E0E0E3]">🏢 All Schools (Global View)</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id} className="bg-[#0F1115] text-[#E0E0E3]">
                    {school.name} ({school.schoolId})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-gray-500">
              <span>/</span>
              <span className="text-[#E0E0E3] capitalize">{(currentTab || '').replace('-', ' ')}</span>
            </div>
          </div>

          {/* Center: Command Palette Trigger Button */}
          <button
            onClick={handleOpenPalette}
            className="hidden md:flex items-center space-x-2.5 w-72 px-3 py-1 rounded-lg bg-[#1F2128] border border-[#2D3038] text-gray-400 hover:text-gray-200 hover:border-indigo-500/40 transition-all text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left font-medium">Quick search or command...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#0F1115] border border-[#2D3038] text-[10px] font-mono text-gray-400">
              ⌘K
            </kbd>
          </button>

          {/* Right: Actions, Role Selector, Theme, Notifications & User */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Designer CTA */}
            <button
              onClick={() => handleSelectTab('designer')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1F2128] border border-[#2D3038] text-xs font-semibold text-gray-200 hover:bg-[#252832] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Designer Studio</span>
            </button>

            {/* Quick Print CTA */}
            <button
              onClick={() => handleSelectTab('print')}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-[0_0_10px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Generate & Print</span>
            </button>

            <div className="h-4 w-[1px] bg-[#2D3038]"></div>

            {/* Role Switcher Matrix */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#1F2128] text-amber-300 border border-[#2D3038] text-xs font-semibold hover:bg-[#252832] transition-colors"
                title="Switch Active RBAC Role for Testing"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline font-mono text-[11px]">{(currentUser?.role || 'SUPER_ADMIN').replace('_', ' ')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-[#0F1115] rounded-xl shadow-2xl border border-[#1F2128] p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#1F2128]">
                    <div className="font-bold text-xs text-[#E0E0E3]">
                      Role-Based Access Control (RBAC)
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Switch simulated user role instantly:
                    </div>
                  </div>
                  <div className="space-y-1 py-1">
                    {roles.map(r => (
                      <button
                        key={r.role}
                        onClick={() => handleSwitchRole(r.role)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start space-x-2.5 ${
                          currentUser?.role === r.role
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                            : 'hover:bg-[#1F2128] text-gray-300'
                        }`}
                      >
                        <div className="mt-0.5">
                          {currentUser?.role === r.role ? (
                            <CheckCircle className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs">{r.label}</div>
                          <div className="text-[10px] text-gray-500 font-normal mt-0.5">{r.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2128] transition-colors"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]"></span>
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-[#0F1115] rounded-xl shadow-2xl border border-[#1F2128] p-3 z-50"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#1F2128] text-xs font-bold">
                    <span>Recent System Alerts</span>
                    <span className="text-[10px] text-indigo-400 font-normal cursor-pointer">Mark read</span>
                  </div>
                  <div className="space-y-2 mt-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#15171E] border border-[#1F2128]">
                      <div className="font-semibold text-gray-200 text-[11px]">
                        Print Job Ready
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Batch PDF for Grade 10 - Section Einstein is compiled and ready for download.
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#15171E] border border-[#1F2128]">
                      <div className="font-semibold text-gray-200 text-[11px]">
                        QR Security Hash Refreshed
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Template Sapphire v3 encryption key validated with DepEd central verification gateway.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 border border-[#2D3038] overflow-hidden flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_rgba(79,70,229,0.3)]">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Module Content View */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.04)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </main>

        {/* Immersive Status Footer Bar */}
        <footer className="h-8 bg-[#0F1115] border-t border-[#1F2128] px-6 flex items-center justify-between text-[10px] text-gray-500 shrink-0 uppercase tracking-tighter">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> System Online</span>
            <span className="hidden sm:inline">CR80 Spec: 85.6mm × 53.98mm</span>
            <span className="hidden md:inline">Tenant: {activeSchool ? activeSchool.name : 'Global SaaS View'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Engine: v3.4.0-Immersive</span>
            <span className="text-indigo-400">Enterprise High-DPI</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

