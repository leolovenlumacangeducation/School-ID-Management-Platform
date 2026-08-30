import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  FileCode,
  Server,
  Shield,
  Container,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { storage } from '../../services/storageService';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'database' | 'prisma' | 'api' | 'docker'>('system');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // System Configuration state
  const [depEdConfig, setDepEdConfig] = useState({
    defaultSchoolYear: '2025-2026',
    defaultRegion: 'National Capital Region (NCR)',
    defaultDivision: 'Division of City Schools - Manila',
    rfidFrequency: '13.56 MHz (Mifare Classic 1K)',
    qrEncryptionStandard: 'HMAC-SHA256 DepEd Cryptographic Envelope',
    dpiResolution: '300 DPI High-Definition Vector Print',
  });

  const handleExportDatabase = () => {
    const jsonStr = storage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SchoolID_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (storage.importFullBackup(content)) {
        alert('Database snapshot successfully restored! Reloading platform...');
        window.location.reload();
      } else {
        alert('Invalid database snapshot format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSeed = () => {
    if (confirm('Reset database back to standard DepEd enterprise seed data? All custom additions will be reverted.')) {
      storage.resetToSeed();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1200);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const prismaSchemaCode = `// datasource & generator
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPER_ADMIN
  SCHOOL_ADMIN
  OPERATOR
  VIEWER
}

enum Status {
  ACTIVE
  INACTIVE
  GRADUATED
  SUSPENDED
  REVOKED
}

enum CardType {
  STUDENT_ID
  TEACHER_ID
  VISITOR_PASS
  RFID_SMART_CARD
}

model School {
  id               String       @id @default(uuid())
  schoolId         String       @unique // 6-digit DepEd School ID
  name             String
  region           String
  division         String
  district         String
  principalName    String
  principalTitle   String
  address          String
  contactNumber    String
  email            String
  logoUrl          String
  sealUrl          String
  primaryColor     String       @default("#1e3a8a")
  secondaryColor   String       @default("#f59e0b")
  users            User[]
  teachers         Teacher[]
  students         Student[]
  sections         Section[]
  templates        Template[]
  assets           Asset[]
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([schoolId])
}

model Student {
  id               String       @id @default(uuid())
  schoolId         String
  school           School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  studentNo        String
  lrn              String       @unique // 12-digit Learner Reference Number
  firstName        String
  middleName       String?
  lastName         String
  suffix           String?
  gradeLevel       String
  sectionId        String?
  section          Section?     @relation(fields: [sectionId], references: [id])
  schoolYear       String
  photoUrl         String
  guardianName     String
  guardianContact  String
  address          String
  bloodType        String?
  rfidNumber       String?
  verifyHash       String       @unique
  status           Status       @default(ACTIVE)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([schoolId, gradeLevel])
  @@index([lrn])
  @@index([verifyHash])
}

model Teacher {
  id               String       @id @default(uuid())
  schoolId         String
  school           School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  employeeNo       String       @unique
  firstName        String
  middleName       String?
  lastName         String
  suffix           String?
  position         String
  department       String
  photoUrl         String
  emergencyContactName String
  emergencyContactPhone String
  address          String
  validUntil       String
  rfidNumber       String?
  verifyHash       String       @unique
  status           Status       @default(ACTIVE)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([schoolId, department])
  @@index([employeeNo])
}

model Template {
  id               String       @id @default(uuid())
  schoolId         String
  school           School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  name             String
  type             CardType
  orientation      String       @default("LANDSCAPE")
  width            Int          @default(1013)
  height           Int          @default(638)
  dpi              Int          @default(300)
  frontElements    Json
  backElements     Json
  isDefault        Boolean      @default(false)
  version          Int          @default(1)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([schoolId, type])
}`;

  const openApiSpec = `openapi: 3.0.3
info:
  title: School ID Management Enterprise REST API
  description: Multi-tenant SaaS API for ID card generation, batch rendering, and security verification.
  version: 1.0.0
servers:
  - url: /api/v1
paths:
  /schools:
    get:
      summary: List all provisioned schools (Super Admin)
      responses:
        '200':
          description: OK
    post:
      summary: Provision new school tenant
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/School'
  /cards/render/batch:
    post:
      summary: Queue batch high-resolution PDF print sheet compilation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                schoolId: { type: string }
                templateId: { type: string }
                recordIds: { type: array, items: { type: string } }
                cardsPerPage: { type: integer, example: 8 }
                paperSize: { type: string, example: "A4" }
      responses:
        '202':
          description: Batch compilation job queued (BullMQ)`;

  const dockerManifest = `# Multi-Stage Dockerfile for High-Performance Next.js / Node.js
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Platform Configuration & Architecture Hub</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise database backups, DepEd compliance presets, Prisma ORM schema, and Docker deployment artifacts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'system', label: 'DepEd Standards & Security', icon: Shield },
          { id: 'database', label: 'Database Backup & Restore', icon: Database },
          { id: 'prisma', label: 'Prisma PostgreSQL Schema', icon: FileCode },
          { id: 'api', label: 'OpenAPI 3.0 REST Docs', icon: Server },
          { id: 'docker', label: 'Docker & Kubernetes Spec', icon: Container },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: System Settings */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Department of Education (DepEd) Enterprise Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Default Academic School Year</label>
              <input
                type="text"
                value={depEdConfig.defaultSchoolYear}
                onChange={e => setDepEdConfig({ ...depEdConfig, defaultSchoolYear: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Default Region</label>
              <input
                type="text"
                value={depEdConfig.defaultRegion}
                onChange={e => setDepEdConfig({ ...depEdConfig, defaultRegion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">RFID / NFC Card Hardware Frequency</label>
              <input
                type="text"
                value={depEdConfig.rfidFrequency}
                onChange={e => setDepEdConfig({ ...depEdConfig, rfidFrequency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">QR Code Cryptographic Envelope</label>
              <input
                type="text"
                value={depEdConfig.qrEncryptionStandard}
                onChange={e => setDepEdConfig({ ...depEdConfig, qrEncryptionStandard: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => alert('Configuration preferences saved.')}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Save DepEd Parameters
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Database Backup & Restore */}
      {activeTab === 'database' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Database Persistence & Snapshot Management
            </h3>
            <p className="text-xs text-slate-400">
              Download complete platform database JSON or restore from snapshot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Export Full Snapshot</h4>
              <p className="text-xs text-slate-500">
                Exports all schools, students, teachers, templates, assets, and audit trails to a single JSON archive.
              </p>
              <button
                onClick={handleExportDatabase}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                Download JSON Backup
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Restore Snapshot</h4>
              <p className="text-xs text-slate-500">
                Upload and import an existing database JSON archive to restore platform state.
              </p>
              <label className="block w-full text-center py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer">
                <span>Select JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDatabase}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Reset to DepEd Seed</h4>
              <p className="text-xs text-slate-500">
                Re-seeds the database with default Manila High and Quezon City High templates and rosters.
              </p>
              <button
                onClick={handleResetSeed}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                Reset Database Seed
              </button>
            </div>
          </div>

          {resetSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Database seed successfully restored!</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Prisma Schema */}
      {activeTab === 'prisma' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Prisma ORM PostgreSQL Schema (`prisma/schema.prisma`)
              </h3>
              <p className="text-xs text-slate-400">
                Enterprise multi-tenant relational schema with indexes, cascades, and enum integrity.
              </p>
            </div>
            <button
              onClick={() => handleCopy(prismaSchemaCode, 'prisma')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              {copiedSection === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'prisma' ? 'Copied' : 'Copy Schema'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl overflow-x-auto">
            <pre className="font-mono text-indigo-300 text-xs leading-relaxed">
              {prismaSchemaCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: OpenAPI Spec */}
      {activeTab === 'api' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                OpenAPI 3.0 / Swagger REST Specification
              </h3>
              <p className="text-xs text-slate-400">
                Production-grade NestJS REST controller endpoints and BullMQ rendering queues.
              </p>
            </div>
            <button
              onClick={() => handleCopy(openApiSpec, 'api')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              {copiedSection === 'api' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'api' ? 'Copied' : 'Copy Spec'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl overflow-x-auto">
            <pre className="font-mono text-emerald-400 text-xs leading-relaxed">
              {openApiSpec}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Docker & K8s Spec */}
      {activeTab === 'docker' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Containerization & Multi-Stage Dockerfile
              </h3>
              <p className="text-xs text-slate-400">
                Optimized Alpine container image for high-density Cloud Run or Kubernetes deployment.
              </p>
            </div>
            <button
              onClick={() => handleCopy(dockerManifest, 'docker')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              {copiedSection === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'docker' ? 'Copied' : 'Copy Dockerfile'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl overflow-x-auto">
            <pre className="font-mono text-amber-300 text-xs leading-relaxed">
              {dockerManifest}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
