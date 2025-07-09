import pool from '../db/db.js';

class BorrowingController {
    // Borrow a book
    async borrowBook(req, res) {
        const { book_id, notes = '' } = req.body;
        const user_id = req.headers['x-user-id'];
        
        if (!user_id || user_id === 'guest') {
            return res.status(403).json({ 
                message: 'Only registered members can borrow books.' 
            });
        }
        
        if (!book_id) {
            return res.status(400).json({ 
                message: 'Book ID is required.' 
            });
        }
        
        try {
            // Check if book exists and is available
            const [books] = await pool.query(
                'SELECT id, title, author, available_copies FROM books WHERE id = ?', 
                [book_id]
            );
            
            if (books.length === 0) {
                return res.status(404).json({ 
                    message: 'Book not found.' 
                });
            }
            
            const book = books[0];
            
            if (book.available_copies <= 0) {
                return res.status(400).json({ 
                    message: 'This book is currently not available for borrowing.' 
                });
            }
            
            // Check if user already has this book borrowed
            const [existingBorrowings] = await pool.query(
                'SELECT id FROM borrowings WHERE user_id = ? AND book_id = ? AND status = "borrowed"',
                [user_id, book_id]
            );
            
            if (existingBorrowings.length > 0) {
                return res.status(400).json({ 
                    message: 'You have already borrowed this book.' 
                });
            }
            
            // Check borrowing limit (max 5 books per user)
            const [userBorrowings] = await pool.query(
                'SELECT COUNT(*) as count FROM borrowings WHERE user_id = ? AND status = "borrowed"',
                [user_id]
            );
            
            if (userBorrowings[0].count >= 5) {
                return res.status(400).json({ 
                    message: 'You have reached the maximum borrowing limit of 5 books.' 
                });
            }
            
            // Calculate due date (14 days from now)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);
            
            // Start transaction
            await pool.query('START TRANSACTION');
            
            try {
                // Create borrowing record
                const [borrowResult] = await pool.query(
                    'INSERT INTO borrowings (user_id, book_id, due_date, notes) VALUES (?, ?, ?, ?)',
                    [user_id, book_id, dueDate, notes]
                );
                
                // Update book availability
                await pool.query(
                    'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
                    [book_id]
                );
                
                // Commit transaction
                await pool.query('COMMIT');
                
                // Return success response
                res.status(201).json({
                    message: 'Book borrowed successfully!',
                    borrowing: {
                        id: borrowResult.insertId,
                        book_title: book.title,
                        book_author: book.author,
                        due_date: dueDate,
                        status: 'borrowed'
                    }
                });
                
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
            
        } catch (error) {
            console.error('Error borrowing book:', error);
            res.status(500).json({ 
                message: 'Error borrowing book', 
                error: error.message 
            });
        }
    }
    
    // Return a book
    async returnBook(req, res) {
        const { borrowing_id } = req.params;
        const user_id = req.headers['x-user-id'];
        
        if (!user_id || user_id === 'guest') {
            return res.status(403).json({ 
                message: 'Only registered members can return books.' 
            });
        }
        
        try {
            // Get borrowing record
            const [borrowings] = await pool.query(
                `SELECT b.*, bk.title, bk.author 
                 FROM borrowings b 
                 JOIN books bk ON b.book_id = bk.id 
                 WHERE b.id = ? AND b.user_id = ? AND b.status = "borrowed"`,
                [borrowing_id, user_id]
            );
            
            if (borrowings.length === 0) {
                return res.status(404).json({ 
                    message: 'Borrowing record not found or already returned.' 
                });
            }
            
            const borrowing = borrowings[0];
            
            // Start transaction
            await pool.query('START TRANSACTION');
            
            try {
                // Update borrowing record
                await pool.query(
                    'UPDATE borrowings SET status = "returned", returned_date = NOW() WHERE id = ?',
                    [borrowing_id]
                );
                
                // Update book availability
                await pool.query(
                    'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
                    [borrowing.book_id]
                );
                
                // Commit transaction
                await pool.query('COMMIT');
                
                res.status(200).json({
                    message: 'Book returned successfully!',
                    borrowing: {
                        id: borrowing_id,
                        book_title: borrowing.title,
                        book_author: borrowing.author,
                        returned_date: new Date()
                    }
                });
                
            } catch (error) {
                await pool.query('ROLLBACK');
                throw error;
            }
            
        } catch (error) {
            console.error('Error returning book:', error);
            res.status(500).json({ 
                message: 'Error returning book', 
                error: error.message 
            });
        }
    }
    
    // Get user's borrowings
    async getUserBorrowings(req, res) {
        const user_id = req.headers['x-user-id'];
        
        if (!user_id || user_id === 'guest') {
            return res.status(403).json({ 
                message: 'Only registered members can view borrowings.' 
            });
        }
        
        try {
            const [borrowings] = await pool.query(
                `SELECT b.*, bk.title, bk.author, bk.isbn, bk.call_number
                 FROM borrowings b 
                 JOIN books bk ON b.book_id = bk.id 
                 WHERE b.user_id = ? 
                 ORDER BY b.borrowed_date DESC`,
                [user_id]
            );
            
            // Check for overdue books
            const now = new Date();
            const processedBorrowings = borrowings.map(borrowing => {
                if (borrowing.status === 'borrowed' && new Date(borrowing.due_date) < now) {
                    // Update overdue status in database
                    pool.query('UPDATE borrowings SET status = "overdue" WHERE id = ?', [borrowing.id]);
                    borrowing.status = 'overdue';
                }
                return borrowing;
            });
            
            res.status(200).json(processedBorrowings);
            
        } catch (error) {
            console.error('Error fetching borrowings:', error);
            res.status(500).json({ 
                message: 'Error fetching borrowings', 
                error: error.message 
            });
        }
    }
    
    // Get all borrowings (admin only)
    async getAllBorrowings(req, res) {
        const isAdmin = req.headers['x-is-admin'] === 'true';
        
        if (!isAdmin) {
            return res.status(403).json({ 
                message: 'Only administrators can view all borrowings.' 
            });
        }
        
        try {
            const [borrowings] = await pool.query(
                `SELECT b.*, bk.title, bk.author, bk.isbn, u.username
                 FROM borrowings b 
                 JOIN books bk ON b.book_id = bk.id 
                 LEFT JOIN users u ON b.user_id = u.id
                 ORDER BY b.borrowed_date DESC`
            );
            
            res.status(200).json(borrowings);
            
        } catch (error) {
            console.error('Error fetching all borrowings:', error);
            res.status(500).json({ 
                message: 'Error fetching borrowings', 
                error: error.message 
            });
        }
    }
}

export default BorrowingController;