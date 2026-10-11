import type { Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  credits: number;
  instructor: string;
  schedule: string;
  capacity: number;
  enrolledCount: number;
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'SECURITY' | 'ACADEMIC' | 'ADMINISTRATIVE';
  content: string;
}

const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-1',
    code: 'SEC-401',
    title: 'Enterprise Cryptography & Authentication Systems',
    department: 'Cybersecurity',
    credits: 4,
    instructor: 'Dr. Alan Turing',
    schedule: 'Mon / Wed 10:00 AM - 11:30 AM',
    capacity: 40,
    enrolledCount: 34,
    description: 'In-depth study of Argon2id hashing, AES-256-GCM AEAD encryption, and RFC 6238 TOTP protocols.',
  },
  {
    id: 'course-2',
    code: 'CS-320',
    title: 'Database Architecture & Disaster Recovery',
    department: 'Computer Science',
    credits: 4,
    instructor: 'Prof. Edgar F. Codd',
    schedule: 'Tue / Thu 01:00 PM - 02:30 PM',
    capacity: 50,
    enrolledCount: 48,
    description: 'Cloud document stores, atomic ACID transactions, automated backup scheduling, and integrity checksums.',
  },
  {
    id: 'course-3',
    code: 'IT-350',
    title: 'Role-Based Access Control & Web Defense',
    department: 'Information Technology',
    credits: 3,
    instructor: 'Dr. Grace Hopper',
    schedule: 'Fri 09:00 AM - 12:00 PM',
    capacity: 35,
    enrolledCount: 29,
    description: 'Implementation of least privilege principles, JWT access tokens, HttpOnly cookies, and security audit logs.',
  },
  {
    id: 'course-4',
    code: 'NET-210',
    title: 'Cloud Network Security & API Hardening',
    department: 'Computer Networks',
    credits: 3,
    instructor: 'Prof. Vint Cerf',
    schedule: 'Wed / Fri 02:00 PM - 03:30 PM',
    capacity: 45,
    enrolledCount: 40,
    description: 'REST API security boundaries, Helmet protection, rate limiting, and cross-platform mobile communication.',
  },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Mandatory Two-Factor Authentication (2FA) Policy in Effect',
    date: '2026-10-10',
    category: 'SECURITY',
    content: 'All students, faculty, and administrative staff must configure Google Authenticator or Microsoft Authenticator before accessing campus portals.',
  },
  {
    id: 'ann-2',
    title: 'Fall Semester Course Registration & Add/Drop Deadline',
    date: '2026-10-08',
    category: 'ACADEMIC',
    content: 'Course registration for the upcoming semester closes on Friday at 5:00 PM. Please consult your academic advisor.',
  },
  {
    id: 'ann-3',
    title: 'Automated Database Snapshot & Cloud Backup Window',
    date: '2026-10-05',
    category: 'ADMINISTRATIVE',
    content: 'School management databases undergo automated cryptographic backups and verification daily. Portal uptime remains 99.9%.',
  },
];

export class SchoolController {
  /**
   * Initializes default course catalog if collection is empty
   */
  private static async ensureInitialData() {
    const coursesSnapshot = await db.collection('courses').limit(1).get();
    if (coursesSnapshot.empty) {
      for (const course of DEFAULT_COURSES) {
        await db.collection('courses').doc(course.id).set(course);
      }
    }

    const announcementsSnapshot = await db.collection('announcements').limit(1).get();
    if (announcementsSnapshot.empty) {
      for (const ann of DEFAULT_ANNOUNCEMENTS) {
        await db.collection('announcements').doc(ann.id).set(ann);
      }
    }
  }

  /**
   * GET /api/school/courses (Public / Guest / User / Admin)
   * Retrieves the academic course catalog.
   */
  public static async getCourses(req: Request, res: Response): Promise<void> {
    await SchoolController.ensureInitialData();
    const snapshot = await db.collection('courses').get();
    const courses = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    sendSuccess(res, { courses, total: courses.length });
  }

  /**
   * GET /api/school/announcements (Public / Guest / User / Admin)
   * Retrieves school announcements and academic notices.
   */
  public static async getAnnouncements(req: Request, res: Response): Promise<void> {
    await SchoolController.ensureInitialData();
    const snapshot = await db.collection('announcements').get();
    const announcements = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    sendSuccess(res, { announcements });
  }

  /**
   * GET /api/school/my-enrollments (USER & ADMIN only)
   * Returns current authenticated student/faculty academic records, GPA, and timetable.
   */
  public static async getMyEnrollments(req: Request, res: Response): Promise<void> {
    const user = req.user!;

    // Return student curriculum records tailored to the authenticated user
    const academicRecord = {
      studentId: `STU-${user.userId.substring(0, 8).toUpperCase()}`,
      username: user.username,
      program: 'Bachelor of Science in Information Technology',
      academicStanding: 'Dean’s Honor List (Good Standing)',
      cumulativeGpa: 3.88,
      completedCredits: 78,
      currentSemesterCredits: 14,
      enrolledCourses: [
        {
          code: 'SEC-401',
          title: 'Enterprise Cryptography & Authentication Systems',
          instructor: 'Dr. Alan Turing',
          schedule: 'Mon / Wed 10:00 AM - 11:30 AM',
          room: 'Turing Cyber Lab 302',
          attendanceRate: '98%',
          midtermGrade: 'A',
        },
        {
          code: 'CS-320',
          title: 'Database Architecture & Disaster Recovery',
          instructor: 'Prof. Edgar F. Codd',
          schedule: 'Tue / Thu 01:00 PM - 02:30 PM',
          room: 'Babbage Hall 105',
          attendanceRate: '95%',
          midtermGrade: 'A-',
        },
        {
          code: 'IT-350',
          title: 'Role-Based Access Control & Web Defense',
          instructor: 'Dr. Grace Hopper',
          schedule: 'Fri 09:00 AM - 12:00 PM',
          room: 'Hopper Auditorium',
          attendanceRate: '100%',
          midtermGrade: 'A+',
        },
      ],
    };

    sendSuccess(res, academicRecord);
  }

  /**
   * POST /api/school/courses (ADMIN only)
   * School Administrator creates a new course.
   */
  public static async createCourse(req: Request, res: Response): Promise<void> {
    const { code, title, department, credits, instructor, schedule, capacity, description } = req.body;

    if (!code || !title || !department) {
      sendError(res, 'VALIDATION_ERROR', 'Course code, title, and department are required', 400);
      return;
    }

    const courseId = `course-${Date.now()}`;
    const newCourse: Course = {
      id: courseId,
      code,
      title,
      department,
      credits: Number(credits) || 3,
      instructor: instructor || 'Staff Faculty',
      schedule: schedule || 'TBA',
      capacity: Number(capacity) || 40,
      enrolledCount: 0,
      description: description || '',
    };

    await db.collection('courses').doc(courseId).set(newCourse);
    sendSuccess(res, newCourse, 'Course created successfully', 201);
  }

  /**
   * DELETE /api/school/courses/:id (ADMIN only)
   * School Administrator removes a course.
   */
  public static async deleteCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await db.collection('courses').doc(id).delete();
    sendSuccess(res, { id }, 'Course deleted successfully');
  }
}
