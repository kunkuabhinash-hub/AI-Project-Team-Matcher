# AI Matching Service

This is the Python FastAPI service foundation for the AI Project Team Matcher. It will eventually handle communicating with Google's Gemini LLM to process and match student profiles with project requirements.

## Architecture
The React frontend communicates solely with the Node.js backend.
The Node.js backend communicates with this Python FastAPI service internally.

## Setup Instructions (Windows)

1. **Navigate to the service directory:**
   ```bash
   cd ai-service
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   Copy `.env.example` to `.env` and adjust if needed:
   ```bash
   copy .env.example .env
   ```

6. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Alternatively, run `python main.py`.*

## Health Check
Verify the service is running by visiting:
`http://localhost:8000/health`
