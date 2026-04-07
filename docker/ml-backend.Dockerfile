FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    libsndfile1 \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY ml_requirements.txt /app/ml_requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel && \
    python -m pip install --no-cache-dir -r /app/ml_requirements.txt

RUN python -m spacy download en_core_web_sm

COPY ml_backend.py /app/ml_backend.py

EXPOSE 8000

CMD ["python", "ml_backend.py"]
