# KK AI Translator

A production-ready, bilingual translation platform with real-time speech transcription, AI-powered translation, and text-to-speech synthesis. Built with a Python Flask API backend and React frontend.

**Perfect for:** Government services, healthcare, customer support, and any scenario requiring real-time bilingual communication.

## Features

- **Real-time Speech Transcription** - Convert speech to text using Azure Speech Services or Whisper
- **AI-Powered Translation** - Translate between 12+ languages using GPT-4o-mini or GPT-3.5
- **Text-to-Speech** - Natural voice synthesis in 40+ languages via Azure Cognitive Services
- **Session Management** - Track conversation history with full audit trails
- **Bilingual Conversations** - Designed for two-way communication (e.g., citizen + caseworker)
- **Session Recap** - AI-generated summaries of conversations in both languages
- **REST API** - Full Swagger/OpenAPI documentation included
- **Docker Ready** - Multi-stage builds for API-only or full-stack deployment

## Supported Languages

Out of the box, 15 languages are enabled by default:

| Language | Code |
|----------|------|
| Arabic (Saudi Arabia) | ar-SA |
| Danish | da-DK |
| Dutch | nl-NL |
| English (UK) | en-GB |
| English (US) | en-US |
| French | fr-FR |
| German | de-DE |
| Italian | it-IT |
| Polish | pl-PL |
| Portuguese | pt-PT |
| Romanian | ro-RO |
| Spanish | es-ES |
| Swedish | sv-SE |
| Turkish | tr-TR |
| Ukrainian | uk-UA |

**450+ additional languages** available via the Settings page - simply enable the languages you need from the Azure Speech Services voice list.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Azure account with:
  - Cognitive Services (Speech)
  - OpenAI Service (GPT models)

### 1. Clone and Configure

```bash
git clone https://github.com/kalundborgkommune/KK-AI-Translator-V1-OS.git
cd KK-AI-Translator-V1-OS

# Copy example environment file
cp .env.example .env

# Edit .env with your Azure credentials (required)
nano .env
```

**Minimum required in `.env`:**
```bash
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=westeurope
AZURE_OPENAI_KEY=your_azure_openai_key
MODEL_AZURE_GPT4OMINI_URL=https://your-resource.openai.azure.com/...
```

### 2. Run with Docker Compose (Recommended)

```bash
docker-compose up -d
```

This starts:
- The translator app (API + React frontend)
- A MySQL database (auto-configured)

Access at: **http://localhost:8080**

API docs at: **http://localhost:8080/api/docs**

Settings page: **http://localhost:8080/settings**

### 3. Alternative: Run Without Docker

```bash
# Requires: Python 3.11+, Node.js 20+, MySQL database
make dev
```

See [SETUP.md](SETUP.md) for manual setup instructions.

### 4. Standalone Docker (Without Compose)

```bash
# Build the image
make build-full

# Run (requires external MySQL)
make run-full
```

## API Documentation

Swagger UI is available at `/docs` when the server is running.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sessions/start-session` | POST | Create a new translation session |
| `/api/v1/sessions/select-language` | POST | Set the source language for a session |
| `/api/v1/sessions/translate` | POST | Transcribe and translate audio/text |
| `/api/v1/sessions/transcribe` | POST | Transcribe audio to text only |
| `/api/v1/sessions/tts` | POST | Convert text to speech |
| `/api/v1/sessions/recap` | GET | Get AI summary of a session |
| `/api/v1/sessions/available-languages` | GET | List supported languages |
| `/api/v1/languages/` | GET | List all language settings |
| `/api/v1/languages/seed` | POST | Seed languages from Azure voices |
| `/api/v1/languages/bulk` | PUT | Bulk update language settings |
| `/api/v1/misc/ping` | GET | Health check |

### Authentication

All API requests require authentication via one of:

1. **API Key Header** (recommended for server-to-server):
   ```
   x-api-key: your-api-key
   ```

2. **Bearer Token** (for Microsoft Entra ID integration):
   ```
   Authorization: Bearer <jwt-token>
   ```

## Project Structure

```
kk-ai-translator/
├── python-be/                 # Flask Backend
│   ├── src/
│   │   ├── app.py            # Application entrypoint
│   │   ├── auth/             # Authentication middleware
│   │   ├── config/           # Configuration & language mappings
│   │   ├── db/               # Database setup (SQLAlchemy)
│   │   ├── models/           # ORM models (Session, Translation)
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Business logic
│   └── tests/                # Pytest test suite
│
├── react-fe/                  # React Frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Custom React hooks
│   │   └── context/          # React context providers
│   └── package.json
│
├── Dockerfile                 # Full-stack Docker build
├── docker-compose.yml         # Docker Compose for local development
├── Makefile                   # Build & deployment automation
└── .env.example              # Environment template
```

## Language Settings

The Settings page (`/settings`) allows administrators to:

1. **Enable/disable languages** - Choose which languages appear in the translator
2. **Select TTS voices** - Pick from multiple voice options per language
3. **Configure AI models** - Choose transcription, translation, and summary models per language

### First-Time Setup

On first launch, click "Seed Languages" in the Settings page to populate the database with all available Azure voices. 15 common languages are enabled by default.

## Configuration

See [SETUP.md](SETUP.md) for detailed configuration instructions including:

- Database setup (MySQL)
- Azure Cognitive Services configuration
- Azure OpenAI deployment
- Docker deployment options
- Production considerations

## Development

### Running Tests

```bash
make test
```

### Code Quality

```bash
# Format code
black python-be/src

# Lint
flake8 python-be/src
```

## Deployment

### Azure Deployment

Two options for deploying to Azure:

| Option | Best For |
|--------|----------|
| **Azure VM + Docker Compose** | Simple setup, full control, all-in-one |
| **Azure Web App + Azure MySQL** | Production, auto-scaling, managed services |

**Quick Deploy (VM approach):**
```bash
# On your Azure VM (Ubuntu 22.04):
curl -fsSL https://get.docker.com | sh
git clone https://github.com/kalundborgkommune/KK-AI-Translator-V1-OS.git
cd KK-AI-Translator-V1-OS
cp .env.example .env  # Add your Azure credentials
docker compose up -d
```

**Quick Deploy (Serverless approach):**
```bash
# Build, push to Azure Container Registry, and deploy
make build-full
make push-full
make deploy-full
```

See [SETUP.md](SETUP.md#azure-deployment) for detailed step-by-step instructions including Azure MySQL setup, SSL configuration, and continuous deployment.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## V2 information

This is the open-source version (V1) of KK AI Translator. To try V2, please contact us.

---

Built with care for real-world bilingual communication needs.
