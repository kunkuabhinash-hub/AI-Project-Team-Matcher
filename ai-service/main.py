from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv
import os

from matching import match_students_to_project, GeminiServiceUnavailableError, GeminiResponseParsingError
from pydantic import ValidationError

from pathlib import Path

# Explicitly load .env from the ai-service directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(
    title="AI Matching Service",
    description="Python FastAPI service for AI Team Matching",
    version="1.0.0"
)

# Configure CORS minimally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class ProjectPayload(BaseModel):
    id: str
    title: str
    description: str
    requiredSkills: List[str]
    category: str
    teamSize: int
    duration: Optional[str] = "Not specified"

class StudentPayload(BaseModel):
    id: str
    name: str
    skills: List[str]
    interests: List[str]
    experience: str
    availability: str
    deterministicMatchedSkills: Optional[List[str]] = []
    baseMatchScore: Optional[int] = 0

class MatchRequest(BaseModel):
    project: ProjectPayload
    students: List[StudentPayload]

class Recommendation(BaseModel):
    studentId: str
    matchScore: int = Field(ge=0, le=100)
    matchedSkills: List[str]
    matchingReasons: List[str]
    skillGaps: List[str]

class MatchResponse(BaseModel):
    projectId: str
    recommendations: List[Recommendation]

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "AI Matching Service"
    }

@app.post("/match", response_model=MatchResponse)
def run_matching(request: MatchRequest):
    # If no Gemini API key is configured, fail clearly without making fake data
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    try:
        # Pass dict representations to the matching logic
        project_dict = request.project.model_dump()
        students_list = [s.model_dump() for s in request.students]
        
        result = match_students_to_project(project_dict, students_list)
        
        # Pydantic will automatically validate the returned dict against MatchResponse
        try:
            response_model = MatchResponse(**result)
        except ValidationError as e:
            print(f"Gemini response validation failed: {e}")
            raise GeminiResponseParsingError("Gemini returned malformed recommendation structure")
        
        # Validate that the recommendations don't exceed teamSize
        if len(response_model.recommendations) > request.project.teamSize:
            raise GeminiResponseParsingError("Gemini returned more recommendations than the requested team size")
            
        # Validate student IDs actually exist in the request
        valid_student_ids = {s.id for s in request.students}
        for rec in response_model.recommendations:
            if rec.studentId not in valid_student_ids:
                raise GeminiResponseParsingError(f"Gemini recommended a fabricated student ID: {rec.studentId}")
                
        return response_model

    except GeminiServiceUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except GeminiResponseParsingError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        import sys
        print("--- MATCHING ERROR TRACEBACK ---", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print("--------------------------------", file=sys.stderr)
        
        error_msg = str(e)
        if "API_KEY" in error_msg or os.environ.get("GEMINI_API_KEY", "") in error_msg:
            error_msg = "An error occurred, but details are redacted to protect secrets."
            
        raise HTTPException(status_code=500, detail=f"Internal server error during matching: {error_msg}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
