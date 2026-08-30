import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { CommandPalette } from './components/layout/CommandPalette';
import { DashboardView } from './components/dashboard/DashboardView';
import { SchoolsView } from './components/schools/SchoolsView';
import { TeachersView } from './components/teachers/TeachersView';
import { StudentsView } from './components/students/StudentsView';
import { SectionsView } from './components/sections/SectionsView';
import { TemplatesView } from './components/templates/TemplatesView';
import { IdDesigner } from './components/designer/IdDesigner';
import { AssetLibraryView } from './components/assets/AssetLibraryView';
import { PrintCenterView } from './components/print/PrintCenterView';
import { VerificationView } from './components/verify/VerificationView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { UserManagementView } from './components/users/UserManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { CardPreviewModal } from './components/common/CardPreviewModal';
import { PhotoManagerModal } from './components/photos/PhotoManagerModal';

import { storage } from './services/storageService';
import { NavigationTab, User, Student, Teacher } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [activeSchoolId, setActiveSchoolId] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User>(storage.getCurrentUser());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Designer Studio State
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [designerTemplateId, setDesignerTemplateId] = useState<string | undefined>(undefined);

  // Global Card Preview Modal State
  const [previewData, setPreviewData] = useState<{
    record: Student | Teacher;
    type: 'STUDENT' | 'TEACHER';
  } | null>(null);

  // Global Photo Manager Modal State
  const [isPhotoManagerOpen, setIsPhotoManagerOpen] = useState(false);
  const [photoManagerType, setPhotoManagerType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  // Dark mode class synchronization
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Command palette hotkey (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLaunchDesigner = (templateId?: string) => {
    setDesignerTemplateId(templateId);
    setIsDesignerOpen(true);
  };

  const handlePreviewCard = (record: Student | Teacher, type: 'STUDENT' | 'TEACHER') => {
    setPreviewData({ record, type });
  };

  const handleOpenPhotoManager = (type: 'STUDENT' | 'TEACHER') => {
    setPhotoManagerType(type);
    setIsPhotoManagerOpen(true);
  };

  return (
    <div className="h-full bg-[#0A0B0E] text-[#E0E0E3] selection:bg-indigo-600 selection:text-white">
      {/* Main Multi-School Layout Shell */}
      <AppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSchoolId={activeSchoolId}
        setActiveSchoolId={setActiveSchoolId}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      >
        {/* Dynamic Route View Switching */}
        {activeTab === 'dashboard' && (
          <DashboardView
            activeSchoolId={activeSchoolId}
            onNavigate={setActiveTab}
            onOpenDesigner={handleLaunchDesigner}
          />
        )}

        {activeTab === 'schools' && (
          <SchoolsView
            activeSchoolId={activeSchoolId}
            onSelectSchool={id => setActiveSchoolId(id)}
          />
        )}

        {activeTab === 'teachers' && (
          <TeachersView
            activeSchoolId={activeSchoolId}
            onPreviewCard={rec => handlePreviewCard(rec, 'TEACHER')}
            onOpenPhotoMatcher={() => handleOpenPhotoManager('TEACHER')}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            activeSchoolId={activeSchoolId}
            onPreviewCard={rec => handlePreviewCard(rec, 'STUDENT')}
            onOpenPhotoMatcher={() => handleOpenPhotoManager('STUDENT')}
          />
        )}

        {activeTab === 'sections' && (
          <SectionsView activeSchoolId={activeSchoolId} />
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            activeSchoolId={activeSchoolId}
            onOpenDesigner={handleLaunchDesigner}
          />
        )}

        {activeTab === 'assets' && (
          <AssetLibraryView activeSchoolId={activeSchoolId} />
        )}

        {activeTab === 'print' && (
          <PrintCenterView
            activeSchoolId={activeSchoolId}
            onNavigateToDesigner={handleLaunchDesigner}
          />
        )}

        {activeTab === 'verify' && <VerificationView />}

        {activeTab === 'audit' && <AuditLogsView />}

        {activeTab === 'users' && (
          <UserManagementView currentUser={currentUser} />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </AppLayout>

      {/* Flagship Canva / Figma-Style ID Designer Studio Fullscreen Overlay */}
      {isDesignerOpen && (
        <IdDesigner
          initialTemplateId={designerTemplateId}
          activeSchoolId={activeSchoolId}
          onBack={() => setIsDesignerOpen(false)}
        />
      )}

      {/* Global Cmd+K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={tab => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        onLaunchDesigner={templateId => {
          handleLaunchDesigner(templateId);
          setIsCommandPaletteOpen(false);
        }}
        activeSchoolId={activeSchoolId}
      />

      {/* Live Single Card Preview Modal (300 DPI Canvas Simulation) */}
      {previewData && (
        <CardPreviewModal
          record={previewData.record}
          type={previewData.type}
          activeSchoolId={activeSchoolId}
          onClose={() => setPreviewData(null)}
          onEditInDesigner={tplId => {
            setPreviewData(null);
            handleLaunchDesigner(tplId);
          }}
        />
      )}

      {/* Bulk Photo Alignment and Cropping Manager Modal */}
      {isPhotoManagerOpen && (
        <PhotoManagerModal
          activeSchoolId={activeSchoolId}
          type={photoManagerType}
          onClose={() => setIsPhotoManagerOpen(false)}
          onPhotosUpdated={() => {
            // Re-render views
            setIsPhotoManagerOpen(false);
          }}
        />
      )}
    </div>
  );
}
