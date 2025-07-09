import express from 'express';
import BookController from '../controllers/bookController.js';
import { requireAdmin, attachUser } from '../middleware/auth.js';
import { sanitizeInput, validateBookInput } from '../middleware/validation.js';

const router = express.Router();
const bookController = new BookController();

// Apply sanitization to all routes
router.use(sanitizeInput);

router.get('/', bookController.getBooks);
router.post('/', attachUser, requireAdmin, validateBookInput, bookController.addBook);
router.put('/:id', attachUser, requireAdmin, bookController.editBook); // REMOVED validateBookInput
router.delete('/:id', attachUser, requireAdmin, bookController.deleteBook);

export default router;