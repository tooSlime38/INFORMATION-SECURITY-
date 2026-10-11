import { Router } from 'express';
import { SchoolController } from '../controllers/school.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

export const schoolRouter = Router();

// Public / Guest Routes (Accessible by unauthenticated visitors and GUEST users)
schoolRouter.get('/courses', SchoolController.getCourses);
schoolRouter.get('/announcements', SchoolController.getAnnouncements);

// Student / Faculty Routes (Accessible only by USER and ADMIN roles)
schoolRouter.get('/my-enrollments', authenticate, requireRole(['USER', 'ADMIN']), SchoolController.getMyEnrollments);

// Registrar / Administrator Routes (Accessible strictly by ADMIN role)
schoolRouter.post('/courses', authenticate, requireRole(['ADMIN']), SchoolController.createCourse);
schoolRouter.delete('/courses/:id', authenticate, requireRole(['ADMIN']), SchoolController.deleteCourse);
