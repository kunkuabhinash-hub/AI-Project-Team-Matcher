# AI Project Team Matcher

## 🚀 About the Project

**AI Project Team Matcher** is an intelligent application designed to connect individuals for project collaborations. By leveraging AI algorithms, the platform matches users based on their skills, interests, and project requirements, ensuring optimal team compositions for success. 

Whether you are a developer looking for a designer, or a project manager seeking a full-stack engineer, this tool helps you find the right teammates seamlessly.

## ✨ Features

- **User Profiles**: Create detailed profiles highlighting your skills, experience, and interests.
- **Project Listings**: Post new projects with specific role requirements and tech stack details.
- **AI-Powered Matching**: Utilizes an AI microservice to recommend the best candidates for your project based on semantic matching.
- **Authentication**: Secure user authentication powered by Firebase.
- **Dashboard**: A central hub to manage your projects, view matches, and update your profile.

## 🏗️ Architecture & Tech Stack

The application is built using a modern, scalable architecture divided into three main components:

### 1. Frontend (Client)
- **Framework**: React.js with Vite
- **Routing**: React Router DOM
- **Styling**: Vanilla CSS with modern aesthetics

### 2. Backend (API Server)
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: Firebase Admin SDK

### 3. AI Service (Microservice)
- **Environment**: Python
- **Functionality**: Handles the complex matching logic and algorithms (housed in the `ai-service` directory).

## 🛠️ Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Python (v3.8 or higher)
- MongoDB (Local or Atlas URI)
- Firebase Account (for authentication)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd "AI PROJECT TEAM MATCER"
   ```

2. **Install Node.js dependencies**:
   This installs the dependencies for both the frontend and backend (as defined in the root `package.json`).
   ```bash
   npm install
   ```

3. **Set up the AI Service**:
   Navigate to the AI service directory and install the Python dependencies.
   ```bash
   cd ai-service
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

## ⚙️ Environment Variables

You will need to set up environment variables for the different parts of the application. Check the respective `.env.example` files in each directory.

### Root / Frontend (`.env`)
Create a `.env` file in the root directory for Vite frontend variables.
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
# Add other Firebase config variables as needed
```

### Backend (`backend/.env`)
Create a `.env` file in the `backend` directory.
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
AI_SERVICE_URL=http://localhost:8000
# Add your Firebase service account credentials/details here
```

### AI Service (`ai-service/.env`)
Create a `.env` file in the `ai-service` directory.
```env
PORT=8000
# Any API keys needed for the AI matching logic (e.g., OpenAI API key)
```

## 🚀 Running the Application

To run the application locally, you will need to start the different services.

1. **Start the AI Service**:
   ```bash
   cd ai-service
   source venv/bin/activate  # Or venv\Scripts\activate on Windows
   python main.py
   ```

2. **Start the Backend Server**:
   In a new terminal window:
   ```bash
   npm run server
   ```

3. **Start the Frontend Development Server**:
   In a new terminal window:
   ```bash
   npm run dev
   ```

The frontend should now be accessible at `http://localhost:5173` (or the port Vite specifies), and the backend API at `http://localhost:5000`.

## 📄 License

This project is open-source and available under the MIT License.
