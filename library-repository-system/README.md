# Library Repository System

This project is a library repository system that allows users to manage a collection of books. It includes both a backend and a frontend component, providing user authentication and book management functionalities.

## Project Structure

```
library-repository-system
├── workspace
│   ├── backend
│   │   ├── src
│   │   │   ├── app.js
│   │   │   ├── controllers
│   │   │   │   ├── authController.js
│   │   │   │   └── bookController.js
│   │   │   ├── db
│   │   │   │   └── db.js
│   │   │   └── routes
│   │   │       ├── authRoutes.js
│   │   │       └── bookRoutes.js
│   │   ├── package.json
│   │   └── README.md
│   └── frontend
│       ├── public
│       │   └── index.html
│       ├── src
│       │   ├── css
│       │   │   └── styles.css
│       │   ├── js
│       │   │   ├── main.js
│       │   │   ├── login.js
│       │   │   └── addBook.js
│       │   └── pages
│       │       ├── landing.html
│       │       ├── login.html
│       │       └── addBook.html
│       ├── package.json
│       └── README.md
├── README.md
```

## Getting Started

### Prerequisites

- Node.js
- MySQL

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the backend directory and install dependencies:
   ```
   cd library-repository-system/workspace/backend
   npm install
   ```

3. Navigate to the frontend directory and install dependencies:
   ```
   cd ../frontend
   npm install
   ```

### Database Setup

1. Create the database and tables in MySQL (e.g., using MySQL Workbench):

   ```sql
   CREATE DATABASE library_repository;
   USE library_repository;

   CREATE TABLE users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(50) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE books (
       id INT AUTO_INCREMENT PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       author VARCHAR(255) NOT NULL,
       isbn VARCHAR(20) UNIQUE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

### Running the Application

1. Start the backend server:
   ```
   cd library-repository-system/workspace/backend
   npm run dev (using nodemon)
   ```

2. Open the frontend application in a web browser:
   ```
   cd library-repository-system/workspace/frontend
   npx live-server
   ```

## Features

- User registration and login functionality.
- Add, retrieve, and manage books in the database.
- Responsive landing page with navigation options.

## API Endpoints

- **Authentication**
  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - Login an existing user

- **Books**
  - `POST /api/books` - Add a new book
  - `GET /api/books` - Retrieve all books

## Contributing

Feel free to submit issues or pull requests for any improvements or features you would like to see.

## License

This project is licensed under the MIT License.