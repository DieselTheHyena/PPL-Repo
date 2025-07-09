import express from 'express';
import BorrowingController from '../controllers/borrowingController.js';
import { requireAdmin, attachUser } from '../middleware/auth.js';

const router = express.Router();
const borrowingController = new BorrowingController();

// All routes require authentication
router.use(attachUser);

// Borrow a book (members only)
router.post('/borrow', borrowingController.borrowBook);

// Return a book (members only)
router.put('/return/:borrowing_id', borrowingController.returnBook);

// Get user's borrowings (members only)
router.get('/user', borrowingController.getUserBorrowings);

// Get all borrowings (admin only)
router.get('/all', requireAdmin, borrowingController.getAllBorrowings);

export default router;