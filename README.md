# PromptCraft AI — AI Prompt Generator

Production-ready full-stack application that transforms simple descriptions into detailed, optimized AI prompts.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS |
| Backend    | Python FastAPI, SQLAlchemy, Alembic     |
| Database   | PostgreSQL 16                           |
| Cache      | Redis 7                                 |
| AI         | OpenAI, Anthropic, Google Gemini, xAI  |
| Deployment | AWS ECS + RDS + ElastiCache             |
| CI/CD      | GitHub Actions                          |

## Project Structure

```
Hr/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/v1/endpoints/ # Route handlers
│   │   ├── core/             # Config, security, logging
│   │   ├── db/               # Database session + migrations
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access layer
│   │   └── tests/            # Pytest tests
│   ├── alembic/              # Database migrations
│   └── main.py               # Application entry point
├── frontend/                 # React application
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Route-level pages
│       ├── hooks/            # Custom React hooks
│       ├── contexts/         # Auth, Theme contexts
│       ├── services/         # API client layer
│       └── types/            # TypeScript type definitions
├── infrastructure/
│   └── terraform/            # AWS infrastructure as code
├── .github/workflows/        # CI/CD pipeline
└── docker-compose.yml        # Local development
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Copy and fill environment variables
cp backend/.env.example backend/.env
# Add your AI API keys to backend/.env

# 2. Start everything
docker-compose up -d

# 3. Open the app
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs (DEBUG=true only)
```

### Option 2: Manual Setup

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Edit with your API keys

# Start PostgreSQL & Redis, then:
alembic upgrade head
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:5173
```

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/v1/auth/register       | Register new user        |
| POST   | /api/v1/auth/login          | Login                    |
| POST   | /api/v1/auth/refresh        | Refresh access token     |
| GET    | /api/v1/auth/me             | Get current user         |
| POST   | /api/v1/prompts/generate    | Generate enhanced prompt |
| GET    | /api/v1/prompts             | List saved prompts       |
| POST   | /api/v1/prompts             | Save a prompt            |
| PUT    | /api/v1/prompts/{id}        | Update a prompt          |
| DELETE | /api/v1/prompts/{id}        | Delete a prompt          |
| POST   | /api/v1/prompts/export      | Export prompts           |
| GET    | /api/v1/templates           | List templates           |
| GET    | /api/v1/history             | Get prompt history       |
| DELETE | /api/v1/history             | Clear history            |

## Running Tests

```bash
cd backend
pytest app/tests/ -v
```

## Deploy to AWS

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="db_password=YOUR_SECURE_PASSWORD"
terraform apply -var="db_password=YOUR_SECURE_PASSWORD"
```

Then push to `main` branch to trigger the GitHub Actions CI/CD pipeline.

## Environment Variables

See `backend/.env.example` for all required variables. Key ones:

- `OPENAI_API_KEY` — OpenAI API key
- `ANTHROPIC_API_KEY` — Anthropic Claude API key  
- `GOOGLE_API_KEY` — Google Gemini API key
- `SECRET_KEY` — JWT signing secret (32+ chars)
- `DATABASE_URL` — PostgreSQL connection string

## Architecture

```
Browser → React SPA → Nginx → FastAPI → PostgreSQL
                                     ↘ Redis (cache)
                                     ↘ OpenAI/Claude/Gemini APIs
```

**Design Patterns:**
- Repository pattern for data access
- Service layer for business logic  
- Dependency injection via FastAPI Depends
- Context API + React Query for state management
- JWT with refresh token rotation
