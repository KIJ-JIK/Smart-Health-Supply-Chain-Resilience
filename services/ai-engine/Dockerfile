# ---------------------------------------------------------
# Production Dockerfile for Smart Health AI & ML Engine
# Python 3.11-slim with pre-compiled wheels for ML workloads
# ---------------------------------------------------------

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for ML packages (Prophet, SciPy, PuLP, XGBoost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Set default port
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# Start FastAPI via uvicorn with shell variable expansion for $PORT
CMD ["sh", "-c", "uvicorn main.py:app --host 0.0.0.0 --port ${PORT:-5000}"]
