FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps for common wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# install pip deps
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools
RUN pip install --no-cache-dir -r requirements.txt

# copy the application
COPY . /app

EXPOSE 8000

# Default command uses uvicorn directly to avoid runtime pkg_resources issues in this PoC
ENV WORKERS=1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers"]
