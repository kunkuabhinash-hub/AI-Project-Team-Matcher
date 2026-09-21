from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv
import os

from matching import match_students_to_project

load_dotenv()

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
        # If Gemini returned invalid data, Pydantic will throw a ValidationError
        # and FastAPI will automatically return a 500/422. However, returning a clear error is better.
        response_model = MatchResponse(**result)
        
        # Validate that the recommendations don't exceed teamSize
        if len(response_model.recommendations) > request.project.teamSize:
            raise ValueError("Gemini returned more recommendations than the requested team size")
            
        # Validate student IDs actually exist in the request
        valid_student_ids = {s.id for s in request.students}
        for rec in response_model.recommendations:
            if rec.studentId not in valid_student_ids:
                raise ValueError(f"Gemini recommended a fabricated student ID: {rec.studentId}")
                
        return response_model

    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        print(f"Matching error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during matching")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
