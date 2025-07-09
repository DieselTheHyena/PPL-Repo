import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

export function requireAdmin(req, res, next) {
    console.log('User in requireAdmin:', req.user);
    if (req.user && req.user.is_admin) {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required.' });
    }
}

export function attachUser(req, res, next) {
    req.user = {
        id: req.header('X-User-Id'),
        is_admin: req.header('X-Is-Admin') === 'true'
    };
    next();
}