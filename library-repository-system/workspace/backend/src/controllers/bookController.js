import pool from '../db/db.js';

function validateBookFields(fields) {
    const errors = [];
    if (!fields.author) errors.push({ field: 'author', message: 'Author is required.' });
    if (!fields.title) errors.push({ field: 'title', message: 'Title is required.' });
    if (!fields.publication) errors.push({ field: 'publication', message: 'Publication is required.' });
    if (!fields.copyright_year || isNaN(Number(fields.copyright_year)) || Number(fields.copyright_year) < 0) {
        errors.push({ field: 'copyright_year', message: 'Copyright year must be a positive number.' });
    }
    if (!fields.physical_description) errors.push({ field: 'physical_description', message: 'Physical description is required.' });
    if (!fields.isbn) errors.push({ field: 'isbn', message: 'ISBN is required.' });
    if (!fields.subject) errors.push({ field: 'subject', message: 'Subject is required.' });
    if (!fields.call_number) errors.push({ field: 'call_number', message: 'Call number is required.' });
    if (!fields.accession_number) errors.push({ field: 'accession_number', message: 'Accession number is required.' });
    if (!fields.location) errors.push({ field: 'location', message: 'Location is required.' });
    return errors;
}

class BookController {
    async addBook(req, res) {
        const {
            author = req.body.author?.trim(),
            title = req.body.title?.trim(),
            publication = req.body.publication?.trim(),
            copyright_year = req.body.copyright_year,
            physical_description = req.body.physical_description?.trim(),
            series = req.body.series ? req.body.series.trim() : null,
            isbn = req.body.isbn?.trim(),
            subject = req.body.subject?.trim(),
            call_number = req.body.call_number?.trim(),
            accession_number = req.body.accession_number?.trim(),
            location = req.body.location?.trim(),
            total_copies = req.body.total_copies || 1,
            allowDuplicateIsbn = req.body.allowDuplicateIsbn
        } = req.body;

        // Basic validation
        const errors = validateBookFields({ author, title, publication, copyright_year, physical_description, isbn, subject, call_number, accession_number, location });
        if (errors.length > 0) {
            return res.status(400).json({ message: 'Validation failed.', errors });
        }

        try {
            // If NOT allowing duplicates, check for existing ISBN
            if (!allowDuplicateIsbn) {
                const [existing] = await pool.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
                if (existing.length > 0) {
                    return res.status(409).json({ message: 'A book with this ISBN already exists.', field: 'isbn' });
                }
            }

            const [result] = await pool.query(
                `INSERT INTO books 
                (author, title, publication, copyright_year, physical_description, series, isbn, subject, call_number, accession_number, location, total_copies, available_copies)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [author, title, publication, copyright_year, physical_description, series, isbn, subject, call_number, accession_number, location, total_copies, total_copies]
            );
            
            // After insert
            const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
            res.status(201).json({ message: 'Book added successfully', book: books[0] });
        } catch (error) {
            res.status(500).json({ message: 'Error adding book', error: error.message });
        }
    }

    async getBooks(req, res) {
        try {
            const [books] = await pool.query('SELECT * FROM books ORDER BY title');
            
            // Clean up any HTML entities in the data before sending
            const cleanedBooks = books.map(book => {
                const cleanedBook = { ...book };
                
                // Clean string fields
                ['title', 'author', 'publication', 'physical_description', 'series', 'isbn', 
                 'subject', 'call_number', 'accession_number', 'location'].forEach(field => {
                    if (cleanedBook[field] && typeof cleanedBook[field] === 'string') {
                        cleanedBook[field] = cleanedBook[field]
                            .replace(/&amp;#x2F;/g, '/')
                            .replace(/&#x2F;/g, '/')
                            .replace(/&amp;/g, '&')
                            .replace(/&quot;/g, '"')
                            .replace(/&#x27;/g, "'")
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>');
                    }
                });
                
                return cleanedBook;
            });
            
            res.json(cleanedBooks);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching books', error: error.message });
        }
    }

    async editBook(req, res) {
        const {
            author = req.body.author?.trim(),
            title = req.body.title?.trim(),
            publication = req.body.publication?.trim(),
            copyright_year = req.body.copyright_year,
            physical_description = req.body.physical_description?.trim(),
            series = req.body.series ? req.body.series.trim() : null,
            isbn = req.body.isbn?.trim(),
            subject = req.body.subject?.trim(),
            call_number = req.body.call_number?.trim(),
            accession_number = req.body.accession_number?.trim(),
            location = req.body.location?.trim(),
            total_copies = req.body.total_copies || 1,
            available_copies = req.body.available_copies || 1
        } = req.body;
        const { id } = req.params;

        console.log('Edit request data:', { id, author, title, publication, copyright_year, physical_description, series, isbn, subject, call_number, accession_number, location, total_copies, available_copies });

        // Basic validation with the cleaned data
        const errors = validateBookFields({ 
            author, title, publication, copyright_year, physical_description, 
            isbn, subject, call_number, accession_number, location 
        });

        if (errors.length > 0) {
            console.log('Validation errors:', errors);
            return res.status(400).json({ message: 'Validation failed.', errors });
        }

        // Validate that available copies don't exceed total copies
        if (Number(available_copies) > Number(total_copies)) {
            return res.status(400).json({ 
                message: 'Available copies cannot exceed total copies.' 
            });
        }

        try {
            // Check current borrowings to ensure we don't set available copies too low
            const [borrowings] = await pool.query(
                'SELECT COUNT(*) as borrowed_count FROM borrowings WHERE book_id = ? AND status = "borrowed"',
                [id]
            );
            
            const currentlyBorrowed = borrowings[0]?.borrowed_count || 0;
            const minAvailable = Number(total_copies) - currentlyBorrowed;
            
            if (Number(available_copies) < minAvailable) {
                return res.status(400).json({ 
                    message: `Cannot set available copies below ${minAvailable}. ${currentlyBorrowed} copies are currently borrowed.` 
                });
            }

            // Update the book
            const [result] = await pool.query(
                `UPDATE books SET 
                    author = ?, title = ?, publication = ?, copyright_year = ?, 
                    physical_description = ?, series = ?, isbn = ?, subject = ?, 
                    call_number = ?, accession_number = ?, location = ?, 
                    total_copies = ?, available_copies = ?
                WHERE id = ?`,
                [author, title, publication, copyright_year, physical_description, series, isbn, subject, call_number, accession_number, location, total_copies, available_copies, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Book not found.' });
            }
            
            const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
            res.status(200).json({ message: 'Book updated successfully', book: books[0] });
            
        } catch (error) {
            console.error('Edit book error:', error);
            if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
                res.status(409).json({ message: 'A book with this ISBN already exists.', field: 'isbn' });
            } else {
                res.status(500).json({ message: 'Error updating book', error: error.message });
            }
        }
    }

    async deleteBook(req, res) {
        const { id } = req.params;
        try {
            // Check if book is currently borrowed
            const [borrowings] = await pool.query(
                'SELECT COUNT(*) as count FROM borrowings WHERE book_id = ? AND status = "borrowed"',
                [id]
            );
            
            if (borrowings[0].count > 0) {
                return res.status(400).json({ 
                    message: 'Cannot delete book that is currently borrowed.' 
                });
            }
            
            // Fetch the book before deleting
            const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
            if (books.length === 0) {
                return res.status(404).json({ message: 'Book not found.' });
            }
            await pool.query('DELETE FROM books WHERE id = ?', [id]);
            res.status(200).json({ message: 'Book deleted successfully', book: books[0] });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting book', error: error.message });
        }
    }

    async getBookById(req, res) {
        const { id } = req.params;
        try {
            const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
            if (books.length === 0) {
                return res.status(404).json({ message: 'Book not found.' });
            }
            res.status(200).json(books[0]);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching book', error: error.message });
        }
    }
}

export default BookController;