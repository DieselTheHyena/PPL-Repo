export const errorHandler = (err, req, res, next) => {
    // Log detailed error information
    console.error('=== ERROR DETAILS ===');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('URL:', req.url);
    console.error('Method:', req.method);
    console.error('Body:', req.body);
    console.error('Headers:', req.headers);
    console.error('Timestamp:', new Date().toISOString());
    console.error('=== END ERROR ===');

    // Handle specific database errors
    if (err.code === 'ER_DUP_ENTRY') {
        const field = err.sqlMessage?.includes('isbn') ? 'ISBN' : 
                     err.sqlMessage?.includes('username') ? 'Username' : 'Field';
        return res.status(409).json({ 
            message: `${field} already exists`,
            field: field.toLowerCase()
        });
    }

    if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ 
            message: 'Database configuration error. Please contact administrator.' 
        });
    }

    if (err.code === 'ECONNREFUSED') {
        return res.status(500).json({ 
            message: 'Database connection failed. Please try again later.' 
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: 'Validation failed',
            errors: err.errors 
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            message: 'Invalid authentication token' 
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            message: 'Authentication token expired' 
        });
    }

    // Default error response
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(status).json({
        message: message,
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err 
        })
    });
};

// Request logger middleware
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusEmoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
        
        console.log(`${statusEmoji} ${req.method} ${req.url} - ${status} - ${duration}ms`);
    });
    
    next();
};