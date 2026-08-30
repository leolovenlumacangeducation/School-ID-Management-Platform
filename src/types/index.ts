/**
 * School ID Management Platform - Global Enterprise Types & Interfaces
 */

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'OPERATOR' | 'VIEWER';

export type NavigationTab =
  | 'dashboard'
  | 'schools'
  | 'teachers'
  | 'students'
  | 'sections'
  | 'templates'
  | 'designer'
  | 'assets'
  | 'print'
  | 'verify'
  | 'audit'
  | 'users'
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  schoolId?: string; // Optional: if assigned to specific school
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface School {
  id: string;
  schoolId: string; // DepEd / Official ID (e.g., "SCH-301928")
  name: string;
  address: string;
  district: string;
  division: string;
  region: string;
  principalName: string;
  schoolEmail: string;
  contactNumber: string;
  website: string;
  logoUrl: string;
  sealUrl: string;
  active: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  stats?: {
    teachersCount: number;
    studentsCount: number;
    sectionsCount: number;
    templatesCount: number;
    printedCount: number;
  };
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'DROPPED' | 'ARCHIVED';
export type TeacherStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'ARCHIVED';

export interface Teacher {
  id: string;
  schoolId: string;
  employeeNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  gender: Gender;
  dateOfBirth: string;
  address: string;
  position: string;
  department: string;
  email: string;
  contactNumber: string;
  photoUrl?: string;
  signatureUrl?: string;
  dateHired: string;
  status: TeacherStatus;
  customFields: {
    bloodType?: string;
    tin?: string;
    gsis?: string;
    philHealth?: string;
    pagibig?: string;
    emergencyContact?: string;
    emergencyNumber?: string;
    rfidNumber?: string;
    nfcUid?: string;
    [key: string]: any;
  };
  qrCodeUrl?: string;
  verifyHash: string;
  idCardIssuedAt?: string;
  idCardExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  schoolId: string;
  sectionId: string;
  lrn: string; // Learner Reference Number (12-digit standard)
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  gender: Gender;
  birthdate: string;
  address: string;
  gradeLevel: string; // e.g., "Grade 7", "Grade 10", "Grade 12 - STEM"
  photoUrl?: string;
  guardianName: string;
  guardianContact: string;
  guardianRelationship?: string;
  status: StudentStatus;
  customFields: {
    bloodType?: string;
    emergencyContact?: string;
    emergencyNumber?: string;
    rfidNumber?: string;
    nfcUid?: string;
    trackStrand?: string;
    [key: string]: any;
  };
  qrCodeUrl?: string;
  verifyHash: string;
  idCardIssuedAt?: string;
  idCardExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  schoolId: string;
  schoolYear: string; // e.g. "2025-2026"
  gradeLevel: string; // e.g. "Grade 10"
  sectionName: string; // e.g. "St. Thomas", "Diamond", "Einstein"
  adviserId?: string; // Teacher ID
  adviserName?: string;
  room?: string;
  studentCount?: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export type TemplateType = 'STUDENT_ID' | 'TEACHER_ID' | 'VISITOR_PASS' | 'TEMP_PASS' | 'RFID_CARD';
export type CardOrientation = 'LANDSCAPE' | 'PORTRAIT';
export type CardSide = 'FRONT' | 'BACK';

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'rect' | 'circle' | 'triangle' | 'line' | 'barcode' | 'qrcode' | 'group' | 'badge';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number; // Corner radius
  ry?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  charSpacing?: number;
  underline?: boolean;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  src?: string; // For images
  variableBinding?: string; // e.g. "{{first_name}}", "{{lrn}}", "{{qr_code}}"
  isDynamicPhoto?: boolean;
  isDynamicSignature?: boolean;
  isDynamicQr?: boolean;
  isDynamicBarcode?: boolean;
  locked?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export interface TemplateSideData {
  backgroundColor: string;
  backgroundImageUrl?: string;
  elements: CanvasElement[];
}

export interface IdTemplate {
  id: string;
  schoolId: string;
  name: string;
  type: TemplateType;
  orientation: CardOrientation;
  isDefault: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  version: number;
  versionHistory?: {
    version: number;
    updatedAt: string;
    updatedBy: string;
    notes?: string;
    frontData: TemplateSideData;
    backData: TemplateSideData;
  }[];
  frontData: TemplateSideData;
  backData: TemplateSideData;
  widthMm: number; // 85.60 mm standard CR80
  heightMm: number; // 53.98 mm standard CR80
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  schoolId?: string; // If null, global asset
  name: string;
  category: 'LOGOS' | 'SIGNATURES' | 'BACKGROUNDS' | 'ICONS' | 'BADGES' | 'GRAPHICS';
  url: string;
  thumbnailUrl?: string;
  fileSize: number; // in bytes
  fileType: string;
  tags: string[];
  createdAt: string;
}

export type PaperSize = 'A4' | 'LETTER' | 'LEGAL';
export type PrintLayout = '1_UP' | '2_UP' | '4_UP' | '8_UP' | '10_UP';

export interface PrintJobConfig {
  schoolId: string;
  templateId: string;
  cardType: 'STUDENT' | 'TEACHER';
  selectedIds: string[]; // List of Student or Teacher IDs
  sides: 'FRONT_ONLY' | 'BACK_ONLY' | 'BOTH_DUPLEX' | 'BOTH_SIDE_BY_SIDE';
  paperSize: PaperSize;
  layout: PrintLayout;
  showBleedMarks: boolean;
  showCropMarks: boolean;
  showSafeZone: boolean;
  bleedMm: number;
  marginMm: number;
  spacingMm: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g., "CREATE_SCHOOL", "UPDATE_TEMPLATE", "PRINT_BATCH", "VERIFY_CARD"
  entity: string; // "School", "Teacher", "Student", "Template", "PrintJob"
  entityId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface VerificationResult {
  valid: boolean;
  verifyHash: string;
  type: 'TEACHER' | 'STUDENT';
  record: Teacher | Student;
  school: School;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED' | 'EXPIRED';
  issuedDate: string;
  expiryDate: string;
  scannedAt: string;
  securityHashMatch: boolean;
}

export interface BackupMetadata {
  id: string;
  fileName: string;
  createdAt: string;
  sizeBytes: number;
  recordCounts: {
    schools: number;
    teachers: number;
    students: number;
    sections: number;
    templates: number;
    assets: number;
  };
}
