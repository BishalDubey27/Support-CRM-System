from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# Schema for creating a note
class NoteCreate(BaseModel):
    note_text: str

# Schema for note API responses
class NoteResponse(BaseModel):
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True


# Schema for creating a ticket (POST /api/tickets)
class TicketCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=128)
    customer_email: EmailStr
    subject: str = Field(..., min_length=1, max_length=256)
    description: str = Field(..., min_length=1)


# Schema for ticket updates (PUT /api/tickets/{ticket_id})
class TicketUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Open|In Progress|Closed)$")
    notes: Optional[str] = None


# Schema for short ticket summary response (GET /api/tickets)
class TicketSummaryResponse(BaseModel):
    ticket_id: str
    customer_name: str
    subject: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Schema for detailed ticket response (GET /api/tickets/{ticket_id})
class TicketDetailResponse(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime
    notes: List[NoteResponse] = []

    class Config:
        from_attributes = True


# Schema for creation receipt
class TicketCreateResponse(BaseModel):
    ticket_id: str
    created_at: datetime
