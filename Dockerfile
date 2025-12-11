# ───── 1) Build React frontend ───────────────────────────────────
FROM node:20 AS build-frontend
WORKDIR /frontend
ARG BUILD_TIMESTAMP
ARG VITE_API_URL=/api/v1
ARG VITE_API_KEY=change-me-in-production
LABEL build_timestamp=${BUILD_TIMESTAMP}

# Pass build args as env vars for Vite
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_KEY=${VITE_API_KEY}

COPY react-fe/package*.json ./
RUN npm install
COPY react-fe/ .
RUN npm run build


# ───── 2) Disposable stage: download static ffmpeg ──────────────
FROM debian:bookworm-slim AS ffmpeg-downloader
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        curl xz-utils ca-certificates && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
      | tar -xJ --strip-components=1 -C /tmp && \
    apt-get purge -y curl xz-utils ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*


# ───── 3) Runtime: Python API + static frontend ─────────────────
FROM python:3.11-slim
WORKDIR /app
ARG BUILD_TIMESTAMP
LABEL build_timestamp=${BUILD_TIMESTAMP}

# 3a) copy the two ffmpeg binaries
COPY --from=ffmpeg-downloader /tmp/ffmpeg  /usr/local/bin/
COPY --from=ffmpeg-downloader /tmp/ffprobe /usr/local/bin/

# 3b) system libs for azure-cognitiveservices-speech
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        libasound2 libstdc++6 ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 3c) Python dependencies  (requirements.txt must include azure-cognitiveservices-speech)
COPY python-be/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 3d) source code + built frontend
COPY python-be/ .
COPY --from=build-frontend /frontend/dist ./src/static

ENV FLASK_APP=src/app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app/src

EXPOSE 80
CMD ["gunicorn", "--bind", "0.0.0.0:80", "src.app:app"]
