# Web Technology

This project includes a frontend login/register page and a Node.js backend using Express and MongoDB.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start MongoDB locally or set `MONGO_URI` for a remote database.

3. Run the server:

```bash
npm start
```

4. Open `http://localhost:3000/login.html` in your browser.

## Features

- User registration and login
- Calculator with expression evaluation and history stored in MongoDB
- Newspaper PDF viewer with user notes/comments stored in MongoDB

## Notes

- Register first, then login.
- Successful login redirects to `home.html`.
- Calculator supports full expressions like `2+3*4` and saves history.
- Newspaper allows adding notes to pages, shared across users.
