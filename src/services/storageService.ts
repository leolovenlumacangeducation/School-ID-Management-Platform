import { School, Teacher, Student, Section, IdTemplate, Asset, AuditLog, User, BackupMetadata } from '../types';
import { SEED_SCHOOLS, SEED_TEACHERS, SEED_STUDENTS, SEED_SECTIONS, SEED_TEMPLATES, SEED_ASSETS, SEED_AUDIT_LOGS, SEED_USERS } from '../data/seedData';

const STORAGE_KEYS = {
  SCHOOLS: 'school_id_platform_schools_v1',
  TEACHERS: 'school_id_platform_teachers_v1',
  STUDENTS: 'school_id_platform_students_v1',
  SECTIONS: 'school_id_platform_sections_v1',
  TEMPLATES: 'school_id_platform_templates_v1',
  ASSETS: 'school_id_platform_assets_v1',
  AUDIT_LOGS: 'school_id_platform_audit_logs_v1',
  USERS: 'school_id_platform_users_v1',
  CURRENT_USER: 'school_id_platform_current_user_v1',
  ACTIVE_SCHOOL_ID: 'school_id_platform_active_school_id_v1',
};

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save to localStorage key ${key}:`, e);
    }
  }

  public initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
      this.set(STORAGE_KEYS.SCHOOLS, SEED_SCHOOLS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
      this.set(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      this.set(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SECTIONS)) {
      this.set(STORAGE_KEYS.SECTIONS, SEED_SECTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      this.set(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
      this.set(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, SEED_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.set(STORAGE_KEYS.CURRENT_USER, SEED_USERS[0]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID)) {
      this.set(STORAGE_KEYS.ACTIVE_SCHOOL_ID, 'sch-1');
    }
  }

  // --- Current User & Active School Context ---
  public getCurrentUser(): User {
    return this.get<User>(STORAGE_KEYS.CURRENT_USER, SEED_USERS[0]);
  }

  public setCurrentUser(user: User): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  public getActiveSchoolId(): string {
    return this.get<string>(STORAGE_KEYS.ACTIVE_SCHOOL_ID, 'sch-1');
  }

  public setActiveSchoolId(schoolId: string): void {
    this.set(STORAGE_KEYS.ACTIVE_SCHOOL_ID, schoolId);
  }

  // --- Audit Log Tracker ---
  public logAudit(action: string, entity: string, details: string, entityId?: string): void {
    const user = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entity,
      entityId,
      details,
      ipAddress: '192.168.1.104',
      userAgent: navigator.userAgent || 'Mozilla/5.0 Chrome/126.0 Enterprise',
      timestamp: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  }

  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  // --- Schools CRUD ---
  public getSchools(): School[] {
    return this.get<School[]>(STORAGE_KEYS.SCHOOLS, SEED_SCHOOLS);
  }

  public getSchoolById(id: string): School | undefined {
    return this.getSchools().find(s => s.id === id);
  }

  public saveSchool(school: School): School {
    const schools = this.getSchools();
    const index = schools.findIndex(s => s.id === school.id);
    let updated: School[];
    if (index >= 0) {
      updated = [...schools];
      updated[index] = { ...school, updatedAt: new Date().toISOString() };
      this.logAudit('UPDATE_SCHOOL', 'School', `Updated details for ${school.name}`, school.id);
    } else {
      const newSchool: School = {
        ...school,
        id: school.id || `sch-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newSchool, ...schools];
      this.logAudit('CREATE_SCHOOL', 'School', `Created new school ${school.name} (${school.schoolId})`, newSchool.id);
      this.set(STORAGE_KEYS.SCHOOLS, updated);
      return newSchool;
    }
    this.set(STORAGE_KEYS.SCHOOLS, updated);
    return updated[index];
  }

  public deleteSchool(id: string): void {
    const school = this.getSchoolById(id);
    const schools = this.getSchools().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.SCHOOLS, schools);
    if (school) {
      this.logAudit('DELETE_SCHOOL', 'School', `Deleted school ${school.name}`, id);
    }
  }

  // --- Teachers CRUD ---
  public getTeachers(schoolId?: string): Teacher[] {
    const all = this.get<Teacher[]>(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
    if (schoolId && schoolId !== 'all') {
      return all.filter(t => t.schoolId === schoolId);
    }
    return all;
  }

  public getTeacherById(id: string): Teacher | undefined {
    return this.get<Teacher[]>(STORAGE_KEYS.TEACHERS, SEED_TEACHERS).find(t => t.id === id);
  }

  public saveTeacher(teacher: Teacher): Teacher {
    const teachers = this.get<Teacher[]>(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
    const index = teachers.findIndex(t => t.id === teacher.id);
    let updated: Teacher[];
    if (index >= 0) {
      updated = [...teachers];
      updated[index] = { ...teacher, updatedAt: new Date().toISOString() };
      this.logAudit('UPDATE_TEACHER', 'Teacher', `Updated teacher record for ${teacher.firstName} ${teacher.lastName}`, teacher.id);
      this.set(STORAGE_KEYS.TEACHERS, updated);
      return updated[index];
    } else {
      const newTeacher: Teacher = {
        ...teacher,
        id: teacher.id || `tch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        verifyHash: teacher.verifyHash || `vfy-tch-${Math.random().toString(36).substring(2, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newTeacher, ...teachers];
      this.logAudit('CREATE_TEACHER', 'Teacher', `Added teacher ${teacher.firstName} ${teacher.lastName} (${teacher.employeeNo})`, newTeacher.id);
      this.set(STORAGE_KEYS.TEACHERS, updated);
      return newTeacher;
    }
  }

  public deleteTeacher(id: string): void {
    const teacher = this.getTeacherById(id);
    const teachers = this.get<Teacher[]>(STORAGE_KEYS.TEACHERS, SEED_TEACHERS).filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TEACHERS, teachers);
    if (teacher) {
      this.logAudit('DELETE_TEACHER', 'Teacher', `Removed teacher ${teacher.firstName} ${teacher.lastName}`, id);
    }
  }

  public bulkSaveTeachers(newTeachers: Teacher[]): void {
    const teachers = this.get<Teacher[]>(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
    const merged = [...newTeachers, ...teachers];
    this.set(STORAGE_KEYS.TEACHERS, merged);
    this.logAudit('BULK_IMPORT', 'Teacher', `Imported ${newTeachers.length} teacher records`);
  }

  // --- Students CRUD ---
  public getStudents(schoolId?: string, sectionId?: string): Student[] {
    let all = this.get<Student[]>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    if (schoolId && schoolId !== 'all') {
      all = all.filter(s => s.schoolId === schoolId);
    }
    if (sectionId && sectionId !== 'all') {
      all = all.filter(s => s.sectionId === sectionId);
    }
    return all;
  }

  public getStudentById(id: string): Student | undefined {
    return this.get<Student[]>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS).find(s => s.id === id);
  }

  public saveStudent(student: Student): Student {
    const students = this.get<Student[]>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    const index = students.findIndex(s => s.id === student.id);
    let updated: Student[];
    if (index >= 0) {
      updated = [...students];
      updated[index] = { ...student, updatedAt: new Date().toISOString() };
      this.logAudit('UPDATE_STUDENT', 'Student', `Updated student record for ${student.firstName} ${student.lastName} (LRN: ${student.lrn})`, student.id);
      this.set(STORAGE_KEYS.STUDENTS, updated);
      return updated[index];
    } else {
      const newStudent: Student = {
        ...student,
        id: student.id || `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        verifyHash: student.verifyHash || `vfy-stu-${Math.random().toString(36).substring(2, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newStudent, ...students];
      this.logAudit('CREATE_STUDENT', 'Student', `Added student ${student.firstName} ${student.lastName} (LRN: ${student.lrn})`, newStudent.id);
      this.set(STORAGE_KEYS.STUDENTS, updated);
      return newStudent;
    }
  }

  public deleteStudent(id: string): void {
    const student = this.getStudentById(id);
    const students = this.get<Student[]>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS).filter(s => s.id !== id);
    this.set(STORAGE_KEYS.STUDENTS, students);
    if (student) {
      this.logAudit('DELETE_STUDENT', 'Student', `Removed student ${student.firstName} ${student.lastName}`, id);
    }
  }

  public bulkSaveStudents(newStudents: Student[]): void {
    const students = this.get<Student[]>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    const merged = [...newStudents, ...students];
    this.set(STORAGE_KEYS.STUDENTS, merged);
    this.logAudit('BULK_IMPORT', 'Student', `Imported ${newStudents.length} student records`);
  }

  // --- Sections CRUD ---
  public getSections(schoolId?: string): Section[] {
    const all = this.get<Section[]>(STORAGE_KEYS.SECTIONS, SEED_SECTIONS);
    if (schoolId && schoolId !== 'all') {
      return all.filter(s => s.schoolId === schoolId);
    }
    return all;
  }

  public getSectionById(id: string): Section | undefined {
    return this.getSections().find(s => s.id === id);
  }

  public saveSection(section: Section): Section {
    const sections = this.getSections();
    const index = sections.findIndex(s => s.id === section.id);
    let updated: Section[];
    if (index >= 0) {
      updated = [...sections];
      updated[index] = { ...section, updatedAt: new Date().toISOString() };
      this.logAudit('UPDATE_SECTION', 'Section', `Updated section ${section.sectionName} (${section.gradeLevel})`, section.id);
      this.set(STORAGE_KEYS.SECTIONS, updated);
      return updated[index];
    } else {
      const newSection: Section = {
        ...section,
        id: section.id || `sec-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newSection, ...sections];
      this.logAudit('CREATE_SECTION', 'Section', `Created section ${section.sectionName} (${section.gradeLevel})`, newSection.id);
      this.set(STORAGE_KEYS.SECTIONS, updated);
      return newSection;
    }
  }

  public deleteSection(id: string): void {
    const sec = this.getSectionById(id);
    const sections = this.getSections().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.SECTIONS, sections);
    if (sec) {
      this.logAudit('DELETE_SECTION', 'Section', `Deleted section ${sec.sectionName}`, id);
    }
  }

  // --- ID Templates CRUD & Version History ---
  public getTemplates(schoolId?: string): IdTemplate[] {
    const all = this.get<IdTemplate[]>(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES);
    if (schoolId && schoolId !== 'all') {
      return all.filter(t => t.schoolId === schoolId || !t.schoolId);
    }
    return all;
  }

  public getTemplateById(id: string): IdTemplate | undefined {
    return this.get<IdTemplate[]>(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES).find(t => t.id === id);
  }

  public saveTemplate(template: IdTemplate, notes?: string): IdTemplate {
    const templates = this.get<IdTemplate[]>(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES);
    const index = templates.findIndex(t => t.id === template.id);
    const currentUser = this.getCurrentUser();
    let updated: IdTemplate[];

    if (index >= 0) {
      const prev = templates[index];
      const newVersion = (prev.version || 1) + 1;
      const historyItem = {
        version: prev.version || 1,
        updatedAt: prev.updatedAt || new Date().toISOString(),
        updatedBy: currentUser.name,
        notes: notes || 'Template modified in designer canvas',
        frontData: JSON.parse(JSON.stringify(prev.frontData)),
        backData: JSON.parse(JSON.stringify(prev.backData)),
      };

      const updatedTemplate: IdTemplate = {
        ...template,
        version: newVersion,
        versionHistory: [historyItem, ...(prev.versionHistory || [])],
        updatedAt: new Date().toISOString(),
      };

      updated = [...templates];
      updated[index] = updatedTemplate;
      this.logAudit('UPDATE_TEMPLATE', 'Template', `Saved version ${newVersion} for "${template.name}"`, template.id);
      this.set(STORAGE_KEYS.TEMPLATES, updated);
      return updatedTemplate;
    } else {
      const newTemplate: IdTemplate = {
        ...template,
        id: template.id || `tpl-${Date.now()}`,
        version: 1,
        versionHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newTemplate, ...templates];
      this.logAudit('CREATE_TEMPLATE', 'Template', `Created new template "${template.name}"`, newTemplate.id);
      this.set(STORAGE_KEYS.TEMPLATES, updated);
      return newTemplate;
    }
  }

  public duplicateTemplate(id: string): IdTemplate | undefined {
    const tpl = this.getTemplateById(id);
    if (!tpl) return undefined;
    const copy: IdTemplate = {
      ...JSON.parse(JSON.stringify(tpl)),
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      isDefault: false,
      version: 1,
      versionHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const templates = [copy, ...this.get<IdTemplate[]>(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES)];
    this.set(STORAGE_KEYS.TEMPLATES, templates);
    this.logAudit('DUPLICATE_TEMPLATE', 'Template', `Duplicated template "${tpl.name}" as "${copy.name}"`, copy.id);
    return copy;
  }

  public restoreTemplateVersion(templateId: string, targetVersion: number): IdTemplate | undefined {
    const tpl = this.getTemplateById(templateId);
    if (!tpl || !tpl.versionHistory) return undefined;
    const historyItem = tpl.versionHistory.find(h => h.version === targetVersion);
    if (!historyItem) return undefined;

    const restored = this.saveTemplate({
      ...tpl,
      frontData: JSON.parse(JSON.stringify(historyItem.frontData)),
      backData: JSON.parse(JSON.stringify(historyItem.backData)),
    }, `Restored from version ${targetVersion}`);
    return restored;
  }

  public deleteTemplate(id: string): void {
    const tpl = this.getTemplateById(id);
    const templates = this.get<IdTemplate[]>(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES).filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TEMPLATES, templates);
    if (tpl) {
      this.logAudit('DELETE_TEMPLATE', 'Template', `Deleted template "${tpl.name}"`, id);
    }
  }

  // --- Assets CRUD ---
  public getAssets(schoolId?: string): Asset[] {
    const all = this.get<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    if (schoolId && schoolId !== 'all') {
      return all.filter(a => !a.schoolId || a.schoolId === schoolId);
    }
    return all;
  }

  public saveAsset(asset: Asset): Asset {
    const assets = this.get<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    const newAsset: Asset = {
      ...asset,
      id: asset.id || `ast-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.ASSETS, [newAsset, ...assets]);
    this.logAudit('UPLOAD_ASSET', 'Asset', `Uploaded asset "${asset.name}" (${asset.category})`, newAsset.id);
    return newAsset;
  }

  public deleteAsset(id: string): void {
    const asset = this.get<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS).find(a => a.id === id);
    const assets = this.get<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS).filter(a => a.id !== id);
    this.set(STORAGE_KEYS.ASSETS, assets);
    if (asset) {
      this.logAudit('DELETE_ASSET', 'Asset', `Deleted asset "${asset.name}"`, id);
    }
  }

  // --- Users & RBAC ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  }

  public saveUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    let updated: User[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = user;
      this.set(STORAGE_KEYS.USERS, updated);
      this.logAudit('UPDATE_USER', 'User', `Updated user permissions for ${user.name} (${user.role})`, user.id);
      return user;
    } else {
      const newUser: User = {
        ...user,
        id: user.id || `usr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      updated = [newUser, ...users];
      this.set(STORAGE_KEYS.USERS, updated);
      this.logAudit('CREATE_USER', 'User', `Provisioned new user account ${user.name} (${user.role})`, newUser.id);
      return newUser;
    }
  }

  public deleteUser(id: string): void {
    const user = this.getUsers().find(u => u.id === id);
    const users = this.getUsers().filter(u => u.id !== id);
    this.set(STORAGE_KEYS.USERS, users);
    if (user) {
      this.logAudit('DELETE_USER', 'User', `Deleted user account ${user.name}`, id);
    }
  }

  // --- Verification Lookup by Hash or ID ---
  public lookupVerification(codeOrHash?: string): { type: 'TEACHER' | 'STUDENT'; record: Teacher | Student; school: School } | null {
    if (!codeOrHash) return null;
    const clean = (codeOrHash || '').trim().toLowerCase();
    if (!clean) return null;
    const teachers = this.get<Teacher[]>(STORAGE_KEYS.TEACHERS, SEED_TEACHERS);
    const students = this.get<Student[]>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    const schools = this.getSchools();

    // Check teacher
    const teacher = teachers.find(
      t => (t.verifyHash && t.verifyHash.toLowerCase() === clean) ||
           (t.employeeNo && t.employeeNo.toLowerCase() === clean) ||
           (t.id && t.id.toLowerCase() === clean) ||
           (t.customFields?.rfidNumber && t.customFields.rfidNumber.toLowerCase() === clean)
    );
    if (teacher) {
      const school = schools.find(s => s.id === teacher.schoolId) || schools[0];
      return { type: 'TEACHER', record: teacher, school };
    }

    // Check student
    const student = students.find(
      s => (s.verifyHash && s.verifyHash.toLowerCase() === clean) ||
           (s.lrn && s.lrn.toLowerCase() === clean) ||
           (s.id && s.id.toLowerCase() === clean) ||
           (s.customFields?.rfidNumber && s.customFields.rfidNumber.toLowerCase() === clean)
    );
    if (student) {
      const school = schools.find(s => s.id === student.schoolId) || schools[0];
      return { type: 'STUDENT', record: student, school };
    }

    return null;
  }

  // --- Backup & Restore System ---
  public exportFullBackup(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: this.getCurrentUser().name,
      schools: this.getSchools(),
      teachers: this.getTeachers('all'),
      students: this.getStudents('all'),
      sections: this.getSections('all'),
      templates: this.getTemplates('all'),
      assets: this.getAssets('all'),
      users: this.getUsers(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.schools) this.set(STORAGE_KEYS.SCHOOLS, data.schools);
      if (data.teachers) this.set(STORAGE_KEYS.TEACHERS, data.teachers);
      if (data.students) this.set(STORAGE_KEYS.STUDENTS, data.students);
      if (data.sections) this.set(STORAGE_KEYS.SECTIONS, data.sections);
      if (data.templates) this.set(STORAGE_KEYS.TEMPLATES, data.templates);
      if (data.assets) this.set(STORAGE_KEYS.ASSETS, data.assets);
      if (data.auditLogs) this.set(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);
      this.logAudit('RESTORE_BACKUP', 'System', 'Restored complete database snapshot from JSON backup');
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }

  public resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEYS.SCHOOLS);
    localStorage.removeItem(STORAGE_KEYS.TEACHERS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.SECTIONS);
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    this.initialize();
    this.logAudit('RESET_DATABASE', 'System', 'Reset system state to factory seed benchmarks');
  }
}

export const storage = new StorageService();
// Initialize storage on load
storage.initialize();
