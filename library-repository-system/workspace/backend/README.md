# Library Repository System - Backend

This document provides an overview of the backend part of the Library Repository System project.

## Project Structure

- `src/app.js`: Main entry point for the backend application.
- `src/controllers/`: Contains controllers for handling business logic.
  - `authController.js`: Handles user authentication.
  - `bookController.js`: Manages book-related operations.
- `src/routes/`: Contains route definitions for the application.
  - `authRoutes.js`: Routes for user authentication.
  - `bookRoutes.js`: Routes for book management.
- `src/db/db.js`: Handles database connection and configuration.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the backend directory:
   ```
   cd library-repository-system/workspace/backend
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Configure the database connection in `src/db/db.js`.

5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in an existing user.

### Books
- `POST /api/books`: Add a new book.
- `GET /api/books`: Retrieve all books.
- `GET /api/books/:id`: Retrieve a specific book by ID.
- `PUT /api/books/:id`: Update a book by ID.
- `DELETE /api/books/:id`: Delete a book by ID.

## License

This project is licensed under the MIT License.