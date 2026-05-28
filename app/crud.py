from typing import List, Optional
import datetime
from sqlalchemy.orm import Session
from app import models, schemas

def generate_ticket_id(db: Session) -> str:
    """
    Finds the highest existing ticket record to generate the next unique ID.
    Starts at TKT-1001.
    """
    last_ticket = db.query(models.Ticket).order_by(models.Ticket.id.desc()).first()
    if not last_ticket:
        return "TKT-1001"
    
    try:
        # Extract the integer sequence number from last ticket_id (e.g. 'TKT-1001' -> 1001)
        last_num = int(last_ticket.ticket_id.split("-")[1])
        next_num = last_num + 1
        return f"TKT-{next_num}"
    except (IndexError, ValueError):
        # Fallback sequential generation if parsing format breaks
        return f"TKT-{last_ticket.id + 1000 + 1}"

def create_ticket(db: Session, ticket: schemas.TicketCreate) -> models.Ticket:
    """
    Creates a new customer ticket record and initializes database entry.
    """
    next_id = generate_ticket_id(db)
    db_ticket = models.Ticket(
        ticket_id=next_id,
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        subject=ticket.subject,
        description=ticket.description,
        status="Open"
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def get_tickets(db: Session, status: Optional[str] = None, search: Optional[str] = None) -> List[models.Ticket]:
    """
    Retrieves all tickets matching optional status filter and/or keyword search queries.
    """
    query = db.query(models.Ticket)
    
    if status:
        query = query.filter(models.Ticket.status == status)
        
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Ticket.customer_name.ilike(search_pattern)) |
            (models.Ticket.customer_email.ilike(search_pattern)) |
            (models.Ticket.ticket_id.ilike(search_pattern)) |
            (models.Ticket.subject.ilike(search_pattern)) |
            (models.Ticket.description.ilike(search_pattern))
        )
        
    # Sort chronologically by newest first
    return query.order_by(models.Ticket.created_at.desc()).all()

def get_ticket_by_id(db: Session, ticket_id: str) -> Optional[models.Ticket]:
    """
    Retrieves a single ticket by its unique public ticket_id.
    """
    return db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()

def update_ticket(db: Session, db_ticket: models.Ticket, update_data: schemas.TicketUpdate) -> models.Ticket:
    """
    Updates status configuration and/or appends new comment logs (Notes).
    """
    if update_data.status:
        db_ticket.status = update_data.status

    if update_data.notes:
        db_note = models.Note(
            ticket_id=db_ticket.ticket_id,
            note_text=update_data.notes
        )
        db.add(db_note)

    # Explicitly set updated_at — SQLAlchemy's onupdate doesn't fire reliably
    # on SQLite without touching the column directly
    db_ticket.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(db_ticket)
    return db_ticket
