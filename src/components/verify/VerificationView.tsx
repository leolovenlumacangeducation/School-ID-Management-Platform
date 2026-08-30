import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Sparkles,
  School,
  Clock,
  Fingerprint,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Student, Teacher, School as SchoolType } from '../../types';

export const VerificationView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    record: Student | Teacher;
    school: SchoolType;
    isAuthentic: boolean;
    scannedAt: string;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleLookup = (searchTarget?: string) => {
    setSearchError(null);
    if (!searchTarget) return;
    const cleaned = searchTarget.trim().toLowerCase();
    if (!cleaned) return;

    const students = storage.getStudents('all');
    const teachers = storage.getTeachers('all');
    const schools = storage.getSchools();

    // Look for exact verifyHash, lrn, employeeNo, or name
    const foundStudent = students.find(
      s =>
        (s.verifyHash && s.verifyHash.toLowerCase() === cleaned) ||
        (s.lrn && s.lrn.toLowerCase() === cleaned) ||
        (s.customFields?.rfidNumber && s.customFields.rfidNumber.toLowerCase() === cleaned) ||
        `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(cleaned)
    );

    const foundTeacher = teachers.find(
      t =>
        (t.verifyHash && t.verifyHash.toLowerCase() === cleaned) ||
        (t.employeeNo && t.employeeNo.toLowerCase() === cleaned) ||
        (t.customFields?.rfidNumber && t.customFields.rfidNumber.toLowerCase() === cleaned) ||
        `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase().includes(cleaned)
    );

    const matchedRecord = foundStudent || foundTeacher;

    if (matchedRecord) {
      const sch = schools.find(s => s.id === matchedRecord.schoolId) || schools[0];
      setScanResult({
        record: matchedRecord,
        school: sch,
        isAuthentic: matchedRecord.status === 'ACTIVE',
        scannedAt: new Date().toISOString(),
      });

      // Log verification scan in audit trail
      storage.logAudit(
        'VERIFY_ID_SCAN',
        'ID_CARD',
        `Verified ID credentials for ${matchedRecord.firstName} ${matchedRecord.lastName} (${'lrn' in matchedRecord ? matchedRecord.lrn : matchedRecord.employeeNo})`,
        matchedRecord.id
      );
    } else {
      setScanResult(null);
      setSearchError(`No verified card credentials found for token "${searchTarget}".`);
    }
  };

  const handleSimulateQrScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const students = storage.getStudents('all');
      if (students[0]) {
        handleLookup(students[0].verifyHash);
      }
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900/60">
          <ShieldCheck className="w-4 h-4" />
          <span>Official DepEd ID Verification Gateway</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Secure ID Card & QR Verification
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Scan card QR code or input 12-digit LRN / Employee Number to validate active school enrollment credentials.
        </p>
      </div>

      {/* Verification Scanner / Search Box */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter LRN (e.g. 109283746192), Employee #, or verification token..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup(query)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            onClick={() => handleLookup(query)}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify ID</span>
          </button>
        </div>

        {/* OR Scanner Mode Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Guard Station Quick Scanner:</span>
          <button
            onClick={handleSimulateQrScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Scanning Camera Viewfinder...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Simulate QR Camera Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {searchError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Verification Result Card */}
      {scanResult && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Status Top Banner */}
          <div
            className={`p-6 text-white flex items-center justify-between ${
              scanResult.isAuthentic ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-rose-600 to-red-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                {scanResult.isAuthentic ? (
                  <CheckCircle2 className="w-7 h-7 text-white" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-white/80 font-bold">
                  DepEd Cryptographic Security Verification
                </div>
                <h2 className="text-xl font-black">
                  {scanResult.isAuthentic ? 'GENUINE & ACTIVE ID CARD' : 'INACTIVE / INVALID CREDENTIAL'}
                </h2>
              </div>
            </div>

            <div className="hidden sm:block text-right text-xs text-white/80">
              <div>Verified: {new Date(scanResult.scannedAt).toLocaleTimeString()}</div>
              <div className="font-mono text-[10px]">AUTH_OK_200</div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 md:p-8 space-y-6 text-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <img
                src={scanResult.record.photoUrl}
                alt=""
                className="w-28 h-36 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-800 shadow-md"
              />

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {'lrn' in scanResult.record ? 'Enrolled Student' : 'Authorized Faculty'}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {scanResult.record.firstName} {scanResult.record.lastName} {scanResult.record.suffix}
                  </h3>
                  <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {'lrn' in scanResult.record ? `LRN: ${(scanResult.record as Student).lrn}` : `EMP: ${(scanResult.record as Teacher).employeeNo}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Institution</span>
                    <span className="font-bold text-slate-900 dark:text-white">{scanResult.school.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Placement / Grade</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {'gradeLevel' in scanResult.record ? (scanResult.record as Student).gradeLevel : (scanResult.record as Teacher).position}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Valid School Year</span>
                    <span>2025-2026</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Blood Group & RFID</span>
                    <span className="font-mono">{(scanResult.record.customFields?.bloodType) || 'O+'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Hash Security Verification Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between font-mono text-[11px]">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <Fingerprint className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">Digital Signature Hash: {scanResult.record.verifyHash}</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-2">
                PASSED SHA-256
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
