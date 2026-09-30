# FluentBridge - A Language Exchange Platform

FluentBridge is a full-stack language exchange platform that helps users connect with people from different backgrounds 
to practice and improve their language skills through **chat and video calls**.

## Features

* User authentication and authorization
* User profiles
* Language exchange between users
* Real-time chat
* Video calls
* Responsive user interface
* Secure authentication using JWT

## Tech Stack

### Frontend

* React
* HTML
* CSS
* JavaScript
* Zustand — State management
* Lucide React — Icons

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Other Technologies

* JWT Authentication
* Stream — Real-time chat and video calls

## Project Structure

```text
FluentBridge/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd FluentBridge
```

### 2. Setup Backend

Navigate to the backend directory:
- cd backend
- npm i
- npm run dev


### 3. Setup Frontend

Open a new terminal and navigate to the frontend directory:
- cd frontend
- npm install
- npm run dev


## Environment Variables

Create a `.env` file in the backend directory and add the required environment variables.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

> **Note:** Do not upload your `.env` file or API secrets to GitHub.

## LIVE DEMO
https://fluentbridge-pifd.onrender.com

