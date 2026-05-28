import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.database import engine, get_db

# Resolve static directory relative to this file so it works regardless of
# which directory uvicorn is launched from (local dev or production server)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Initialize SQLite database tables automatically
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Support CRM API",
    description="Backend API for Datastraw Support CRM hiring assessment.",
    version="1.0.0"
)

# Standard CORS Middleware setup to permit frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API ENDPOINTS ---

@app.post(
    "/api/tickets",
    response_model=schemas.TicketCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new support ticket"
)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    """
    Creates a support ticket inside the database.
    Generates a unique ticket_id (e.g. TKT-1001) and sets state to 'Open'.
    """
    try:
        new_ticket = crud.create_ticket(db=db, ticket=ticket)
        return schemas.TicketCreateResponse(
            ticket_id=new_ticket.ticket_id,
            created_at=new_ticket.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create ticket: {str(e)}"
        )


@app.get(
    "/api/tickets",
    response_model=List[schemas.TicketSummaryResponse],
    summary="Retrieve support tickets lists"
)
def get_tickets(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves all registered tickets.
    Supports optional status filters (Open, In Progress, Closed) and search queries.
    """
    tickets = crud.get_tickets(db=db, status=status, search=search)
    return tickets


@app.get(
    "/api/tickets/{ticket_id}",
    response_model=schemas.TicketDetailResponse,
    summary="Fetch comprehensive ticket details"
)
def get_ticket_details(ticket_id: str, db: Session = Depends(get_db)):
    """
    Fetches details of a single ticket along with its complete chronological history notes.
    """
    db_ticket = crud.get_ticket_by_id(db=db, ticket_id=ticket_id)
    if not db_ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} was not found"
        )
    return db_ticket


@app.put(
    "/api/tickets/{ticket_id}",
    summary="Update ticket status and/or append activity notes"
)
def update_ticket(
    ticket_id: str,
    update_data: schemas.TicketUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates the ticket state and appends agent comment notes if provided in the body.
    """
    db_ticket = crud.get_ticket_by_id(db=db, ticket_id=ticket_id)
    if not db_ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} was not found"
        )
        
    updated_ticket = crud.update_ticket(db=db, db_ticket=db_ticket, update_data=update_data)
    return {
        "success": True,
        "updated_at": updated_ticket.updated_at
    }


# --- FRONTEND ROUTING & STATIC FILES MOUNTING ---

STATIC_DIR = os.path.join(BASE_DIR, "static")

# Serve the SPA shell — path is resolved relative to this file, not the CWD
@app.get("/", include_in_schema=False)
def index_redirect():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# Serve all CSS, JS, and other static assets
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
