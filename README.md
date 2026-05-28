# Datastraw Customer Support CRM System

A fully-functional, responsive, and high-fidelity customer support ticketing management system built as a hiring assessment for **Datastraw Technologies**.

This system features a robust **Python + FastAPI** backend serving a structured RESTful API over a local, persistent **SQLite** database, paired with a gorgeous, high-performance **Tailwind CSS + Vanilla JS** Single Page Application (SPA) dashboard.

---

## 🚀 Key Features

* **Create Tickets**: Beautiful modal form with dynamic client-side field validation to raise support tickets with customer names, emails, subject lines, and detail descriptions. Generates chronological unique ticket IDs (e.g. `TKT-1001`, `TKT-1002`).
* **Interactive Dashboard List View**: A premium grid-based slate list layout showcasing all tickets along with customer details, dates, and color-coded status badges.
* **Instant "As-You-Type" Search**: Search bar with debounced client-side inputs operating under 50ms to query across names, ticket IDs, email addresses, and description details.
* **Filter by Status**: Easily group tickets using filter tabs (`All`, `Open`, `In Progress`, `Closed`).
* **Slide-Out Details Drawer**: Interactive sidebar overlay revealing comprehensive ticket details, email hotlinks, and chronologically recorded note logs.
* **State Operations & Activity Logging**: Transition ticket statuses and write internal audit logs or agent notes simultaneously.
* **Auto-Initialization Database**: Database tables and standard configurations generate automatically on project startup.

---

## 🛠 Tech Stack

* **Backend Framework**: Python 3.8+ with **FastAPI** (High performance, clean type hints, self-generating documentation).
* **Database Engine & ORM**: **SQLite** via **SQLAlchemy ORM** (Fast, zero-configuration local file DB).
* **Data Validations**: **Pydantic v2** (Enforces data integrity, emails, and input character parameters).
* **Web Server**: **Uvicorn** (Asynchronous ASGI server for development and production execution).
* **Frontend Design**: **Tailwind CSS v3 (CDN)** + **Lucide Icons** + **Google Fonts (Plus Jakarta Sans)** (Clean slate-dark themed visual design).
* **Frontend Core**: **Vanilla JavaScript (ES6+)** utilizing the asynchronous `Fetch` API, DOM manipulations, and debounced input events.

---

## 📁 Directory Structure

```
Support CRM System/
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI initialization, endpoints routing & assets serving
│   ├── database.py        # Database engine setup and connection dependencies
│   ├── models.py          # SQLAlchemy models definitions (tickets, notes)
│   ├── schemas.py         # Pydantic schema validation structures
│   ├── crud.py            # SQLite CRUD query operations
│   └── static/            # Frontend SPA Dashboard assets
│       ├── index.html     # Main dashboard interface
│       ├── css/
│       │   └── styles.css # Design system classes and animation transitions
│       └── js/
│           └── app.js     # Responsive API interactions and DOM management
├── Procfile               # Deployment start command (Railway / Render)
├── requirements.txt       # Core dependencies
├── README.md              # Help and documentation
├── .gitignore             # Standard git exclusions
└── .env.example           # Configurations template
```

---

## 💻 Local Installation & Setup

Follow these simple steps to run the application locally in less than 2 minutes:

### 1. Clone the repository and navigate inside:
```bash
git clone https://github.com/BishalDubey27/Support-CRM-System.git
cd Support-CRM-System
```

### 2. Set up a Python Virtual Environment:
**Windows:**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install required libraries:
```bash
pip install -r requirements.txt
```

### 4. Boot up the local development server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Access the application:
* Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser to view the interactive Support Hub dashboard.
* Access **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)** to test REST APIs directly inside FastAPI's automated Swagger playground.

---

## 📡 REST API Reference

All requests must use `Content-Type: application/json`.

### `POST /api/tickets`
Creates a new support ticket.
* **Payload**:
  ```json
  {
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "subject": "Billing dispute",
    "description": "Charged twice on invoice #901."
  }
  ```
* **Response** (Status Code `201`):
  ```json
  {
    "ticket_id": "TKT-1001",
    "created_at": "2026-05-28T14:30:00Z"
  }
  ```

### `GET /api/tickets`
Lists all registered tickets. Supports status filtering and search query strings.
* **Query Params**: `?status=Open&search=Jane` (both optional)
* **Response** (Status Code `200`):
  ```json
  [
    {
      "ticket_id": "TKT-1001",
      "customer_name": "Jane Doe",
      "subject": "Billing dispute",
      "status": "Open",
      "created_at": "2026-05-28T14:30:00Z"
    }
  ]
  ```

### `GET /api/tickets/{ticket_id}`
Retrieves complete details of a single ticket including comments chronology.
* **Response** (Status Code `200`):
  ```json
  {
    "ticket_id": "TKT-1001",
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "subject": "Billing dispute",
    "description": "Charged twice on invoice #901.",
    "status": "Open",
    "created_at": "2026-05-28T14:30:00Z",
    "updated_at": "2026-05-28T14:32:00Z",
    "notes": [
      {
        "note_text": "Investigated transaction logs. Refunding double charge.",
        "created_at": "2026-05-28T14:32:00Z"
      }
    ]
  }
  ```

### `PUT /api/tickets/{ticket_id}`
Updates a ticket's status and/or appends new agent comment notes.
* **Payload**:
  ```json
  {
    "status": "In Progress",
    "notes": "Spoke to customer. Initiated credit transfer."
  }
  ```
* **Response** (Status Code `200`):
  ```json
  {
    "success": true,
    "updated_at": "2026-05-28T14:35:00Z"
  }
  ```

---

## 🌐 Production Deployment

This application can be deployed for free on either **Render.com** or **Railway.app** in minutes:

### Deploying to Render.com
1. Create a **New Web Service** and link your GitHub repository.
2. Set the configuration details:
   * **Environment**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Click **Deploy**.
4. *(Optional)* Add a **Disk mount** at `/data` and set environment variable `DATABASE_URL=sqlite:////data/crm.db` to persist database records forever.
