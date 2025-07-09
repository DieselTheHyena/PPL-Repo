import express from 'express';
import AuthController from '../controllers/authController.js';
import { sanitizeInput, validateUserRegistration, validateLogin } from '../middleware/validation.js';

const router = express.Router();
const authController = new AuthController();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Apply validation to specific routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

export default router;