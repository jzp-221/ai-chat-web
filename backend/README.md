# FastAPI backend

Create and activate a virtual environment, install dependencies, then run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/api/health`

Interactive API docs: `http://localhost:8000/docs`
