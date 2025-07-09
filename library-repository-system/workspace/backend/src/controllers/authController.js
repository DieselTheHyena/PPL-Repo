import pool from '../db/db.js';
import bcrypt from 'bcryptjs'; // Changed from 'bcrypt' to 'bcryptjs'

class AuthController {
    async register(req, res, next) { // ADD next parameter
        const { surname, firstname, middleInitial, username, password, displayName } = req.body;
        
        try {
            // Validation
            if (!surname || !firstname || !username || !password) {
                const error = new Error('All required fields must be filled.');
                error.status = 400;
                return next(error);
            }
            
            if (password.length < 8) {
                const error = new Error('Password must be at least 8 characters.');
                error.status = 400;
                return next(error);
            }
            
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                const error = new Error('Username must be alphanumeric.');
                error.status = 400;
                return next(error);
            }
            
            if (middleInitial && middleInitial.length > 1) {
                const error = new Error('Middle initial must be one character.');
                error.status = 400;
                return next(error);
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const mi = middleInitial ? middleInitial : null;
            
            await pool.query(
                'INSERT INTO users (surname, firstname, middle_initial, username, password, display_name) VALUES (?, ?, ?, ?, ?, ?)',
                [surname, firstname, mi, username, hashedPassword, displayName]
            );
            
            res.status(201).json({ message: 'Registration successful!' });
        } catch (error) {
            next(error); // Pass error to error handler
        }
    }

    async login(req, res, next) { // ADD next parameter
        const { username, password } = req.body;
        
        try {
            if (!username || !password) {
                const error = new Error('Username and password are required.');
                error.status = 400;
                return next(error);
            }

            const [rows] = await pool.query(
                'SELECT id, username, display_name, firstname, surname, middle_initial, is_admin, password FROM users WHERE username = ?',
                [username]
            );
            
            const user = rows[0];
            if (!user) {
                const error = new Error('Invalid credentials');
                error.status = 401;
                return next(error);
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                const error = new Error('Invalid credentials');
                error.status = 401;
                return next(error);
            }
            
            res.status(200).json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    display_name: user.display_name,
                    firstname: user.firstname,
                    surname: user.surname,
                    middle_initial: user.middle_initial,
                    is_admin: user.is_admin
                }
            });
        } catch (error) {
            next(error); // Pass error to error handler
        }
    }
}

export default AuthController;