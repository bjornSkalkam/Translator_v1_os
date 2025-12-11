# Setup Guide

This guide walks you through setting up KK AI Translator from scratch.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Database Setup](#database-setup)
3. [Azure Services Setup](#azure-services-setup)
4. [Environment Configuration](#environment-configuration)
5. [Local Development](#local-development)
6. [Docker Deployment](#docker-deployment)
7. [Azure Web App Deployment](#azure-web-app-deployment)
8. [Iframe/Embedded Deployment](#iframeembedded-deployment)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Hardware
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 10 GB

### Recommended for Production
- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Storage:** 20+ GB SSD

### Software Requirements
- Python 3.11 or higher
- Node.js 20+ (for frontend development)
- Docker 24+ (for containerized deployment)
- MySQL 8.0+ or compatible (Azure Database for MySQL, AWS RDS, etc.)

---

## Database Setup

### Option 1: Local MySQL

```bash
# Install MySQL (macOS)
brew install mysql
brew services start mysql

# Install MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql

# Create database and user
mysql -u root -p
```

```sql
CREATE DATABASE translator_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'translator_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON translator_db.* TO 'translator_user'@'localhost';
FLUSH PRIVILEGES;
```

### Option 2: Docker MySQL (Development)

```bash
docker run -d \
  --name translator-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=translator_db \
  -e MYSQL_USER=translator_user \
  -e MYSQL_PASSWORD=your_secure_password \
  -p 3306:3306 \
  mysql:8.0
```

### Option 3: Azure Database for MySQL

1. Go to Azure Portal > Create a resource > Azure Database for MySQL
2. Choose "Flexible server"
3. Configure:
   - Server name: `your-translator-db`
   - Region: Same as your app
   - MySQL version: 8.0
   - Compute + storage: Burstable B1ms (minimum)
4. Create a database named `translator_db`
5. Configure firewall rules to allow your app's IP

### Database Schema

The application uses SQLAlchemy ORM with auto-migration. Tables are created automatically on first run:

- **sessions** - Translation session records
- **translations** - Individual translation entries linked to sessions
- **language_settings** - Per-language configuration (voices, models, enabled state)

---

## Azure Services Setup

### Azure Cognitive Services - Speech

1. Go to Azure Portal > Create a resource > Speech
2. Configure:
   - Name: `your-speech-service`
   - Region: Choose a region with good language support
   - Pricing tier: S0 (Standard) for production
3. After creation, go to "Keys and Endpoint"
4. Copy:
   - `KEY 1` → `AZURE_SPEECH_KEY`
   - `Location/Region` → `AZURE_SPEECH_REGION`

**Supported regions for all languages:** West Europe, East US, Southeast Asia

### Azure OpenAI Service

1. Go to Azure Portal > Create a resource > Azure OpenAI
2. After creation, go to Azure OpenAI Studio
3. Deploy models:
   - **GPT-4o-mini** (recommended for translation)
   - **GPT-3.5-turbo** (alternative/fallback)
4. For each deployment, note the endpoint URL

**Example endpoint format:**
```
https://your-resource.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview
```

5. Copy:
   - API Key → `AZURE_OPENAI_KEY`
   - Endpoint URLs → `MODEL_AZURE_GPT4OMINI_URL`, `MODEL_GPT35_URL`

### Alternative: OpenAI API (Non-Azure)

If using OpenAI directly instead of Azure OpenAI:

1. Get API key from https://platform.openai.com
2. Modify `python-be/src/services/translation_service.py` to use OpenAI's API format

### Alternative: Local LLM (Ollama)

For offline/privacy-focused deployments:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3

# Run Ollama server
ollama serve
```

Set `MODEL_OLLAMA_3_URL=http://localhost:11434/api/generate` in `.env`

---

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Required - API Security
API_KEY=generate-a-secure-random-string-here

# Required - Database
MYSQL_USER=translator_user
MYSQL_PASSWORD=your_secure_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=translator_db

# Required - Azure Speech
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=westeurope

# Required - Azure OpenAI
AZURE_OPENAI_KEY=your_openai_key
MODEL_AZURE_GPT4OMINI_URL=https://your-resource.openai.azure.com/...

# Optional - Server
PORT=80
```

### Generate a Secure API Key

```bash
# Using openssl
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Local Development

### Backend Only

```bash
# From project root
make dev
```

This creates a virtual environment, installs dependencies, and starts Flask with hot-reload.

**Access points:**
- App: http://localhost:8080
- API: http://localhost:8080/api/v1/
- Swagger docs: http://localhost:8080/api/docs
- Settings: http://localhost:8080/settings

### Frontend Development

```bash
cd react-fe
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and proxies API calls to the backend.

### Running Tests

```bash
make test
```

---

## Docker Deployment

### Build Images

```bash
# API only (smaller, faster builds)
make build-api

# Full stack (API + React frontend)
make build-full
```

### Run Locally with Docker

```bash
# API only
make run-api

# Full stack
make run-full
```

### Docker Compose (Recommended for local development)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    env_file:
      - .env
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: translator_db
      MYSQL_USER: translator_user
      MYSQL_PASSWORD: your_secure_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Run with:
```bash
docker-compose up -d
```

---

## Azure Deployment

There are two main approaches to deploying KK AI Translator on Azure:

| Approach | Best For | Pros | Cons |
|----------|----------|------|------|
| **Option A: Azure VM + Docker Compose** | Simple deployments, full control | Easy to set up, familiar workflow, all-in-one | Manual scaling, manage your own VM |
| **Option B: Azure Web App + Azure MySQL** | Production, auto-scaling | Managed services, auto-scaling, high availability | More Azure services to configure |

---

### Option A: Azure VM with Docker Compose

This is the simplest approach - run everything on a single Linux VM using Docker Compose.

#### Step 1: Create an Azure VM

```bash
# Create resource group
az group create --name translator-rg --location westeurope

# Create VM (Ubuntu 22.04 LTS)
az vm create \
  --resource-group translator-rg \
  --name translator-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Open ports 80 and 8080
az vm open-port --resource-group translator-rg --name translator-vm --port 80,8080 --priority 100
```

#### Step 2: SSH into VM and Install Docker

```bash
# Get public IP
az vm show -d -g translator-rg -n translator-vm --query publicIps -o tsv

# SSH in
ssh azureuser@<public-ip>

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
ssh azureuser@<public-ip>
```

#### Step 3: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/kalundborgkommune/KK-AI-Translator-V1-OS.git
cd KK-AI-Translator-V1-OS

# Configure environment
cp .env.example .env
nano .env  # Add your Azure credentials
```

#### Step 4: Run with Docker Compose

```bash
docker-compose up -d
```

The translator is now running at `http://<public-ip>:8080`

#### Optional: Set Up Nginx Reverse Proxy + SSL

```bash
# Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/translator
```

```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable and get SSL certificate
sudo ln -s /etc/nginx/sites-available/translator /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

---

### Option B: Azure Web App + Azure Database for MySQL (Serverless)

This approach uses Azure's managed services for auto-scaling and high availability.

#### Step 1: Create Azure Resources

```bash
# Create resource group
az group create --name translator-rg --location westeurope

# Create Azure Container Registry
az acr create \
  --resource-group translator-rg \
  --name translateracr \
  --sku Basic

# Create App Service Plan (Linux)
az appservice plan create \
  --name translator-plan \
  --resource-group translator-rg \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --resource-group translator-rg \
  --plan translator-plan \
  --name kk-translator-app \
  --deployment-container-image-name nginx

# Create Azure Database for MySQL (Flexible Server)
az mysql flexible-server create \
  --resource-group translator-rg \
  --name translator-mysql \
  --admin-user translator_admin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 20 \
  --version 8.0.21 \
  --public-access 0.0.0.0

# Create the database
az mysql flexible-server db create \
  --resource-group translator-rg \
  --server-name translator-mysql \
  --database-name translator_db
```

#### Step 2: Configure Local Environment

Add these to your `.env`:

```bash
# Azure Container Registry
ACR_NAME=translateracr
AZURE_ACR_PASSWORD=<get from step below>
AZURE_WEBAPP_NAME=kk-translator-app
AZURE_RESOURCE_GROUP=translator-rg

# Get ACR credentials
az acr credential show --name translateracr
```

#### Step 3: Build and Push Image

```bash
# Build the Docker image
make build-full

# Push to Azure Container Registry
make push-full
```

#### Step 4: Configure Web App Environment Variables

```bash
# Get MySQL connection string
az mysql flexible-server show \
  --resource-group translator-rg \
  --name translator-mysql \
  --query "fullyQualifiedDomainName" -o tsv

# Configure app settings
az webapp config appsettings set \
  --resource-group translator-rg \
  --name kk-translator-app \
  --settings \
    MYSQL_HOST=translator-mysql.mysql.database.azure.com \
    MYSQL_USER=translator_admin \
    MYSQL_PASSWORD='YourSecurePassword123!' \
    MYSQL_DB=translator_db \
    MYSQL_PORT=3306 \
    AZURE_SPEECH_KEY=your_speech_key \
    AZURE_SPEECH_REGION=westeurope \
    AZURE_OPENAI_KEY=your_openai_key \
    MODEL_AZURE_GPT4OMINI_URL=https://your-resource.openai.azure.com/... \
    API_KEY=your_secure_api_key \
    WEBSITES_PORT=80
```

#### Step 5: Deploy

```bash
# Deploy the container
make deploy-full

# Or manually:
az webapp config container set \
  --resource-group translator-rg \
  --name kk-translator-app \
  --container-image-name translateracr.azurecr.io/translator/translator-full:latest \
  --container-registry-url https://translateracr.azurecr.io \
  --container-registry-user translateracr \
  --container-registry-password <acr-password>

# Restart the app
az webapp restart --resource-group translator-rg --name kk-translator-app
```

Your app is now available at `https://kk-translator-app.azurewebsites.net`

#### Step 6: Enable Continuous Deployment (Optional)

```bash
# Enable continuous deployment from ACR
az webapp deployment container config \
  --resource-group translator-rg \
  --name kk-translator-app \
  --enable-cd true
```

Now whenever you push a new image to ACR, the Web App automatically restarts with the new version.

---

### Makefile Commands Reference

The Makefile includes these Azure deployment commands:

| Command | Description |
|---------|-------------|
| `make build-full` | Build Docker image (runs tests first) |
| `make push-full` | Push image to Azure Container Registry |
| `make deploy-full` | Deploy to Azure Web App |
| `make build-api` | Build API-only image (no frontend) |
| `make push-api` | Push API image to ACR |
| `make deploy-api` | Deploy API-only to Azure |

### Required `.env` Variables for Azure Deployment

```bash
# Azure Container Registry
ACR_NAME=your-acr-name
AZURE_ACR_PASSWORD=your-acr-password

# Azure Web App
AZURE_WEBAPP_NAME=your-webapp-name
AZURE_RESOURCE_GROUP=your-resource-group
```

---

## Iframe/Embedded Deployment

The KK AI Translator frontend can be embedded within other applications using an iframe. This is useful for integrating the translator into:

- Microsoft Teams tabs
- SharePoint pages
- Custom portals and dashboards
- Any web application that supports iframes

### How It Works

When embedded in an iframe, the parent application communicates with the translator via the `postMessage` API. This allows the parent to:

1. **Send authentication tokens** - Pass JWT tokens from your identity provider
2. **Control theming** - Sync light/dark mode with your parent application

### Parent Window Integration

Add this code to your parent application:

```html
<iframe
  id="translator-iframe"
  src="https://your-translator-url.com"
  style="width: 100%; height: 600px; border: none;">
</iframe>

<script>
const iframe = document.getElementById('translator-iframe');

// Wait for iframe to load
iframe.onload = () => {
  // Send authentication token (e.g., from Microsoft Entra ID)
  iframe.contentWindow.postMessage({
    type: 'auth',
    token: 'eyJhbGciOiJSUzI1NiIs...'  // Your JWT token
  }, '*');

  // Send theme preference
  iframe.contentWindow.postMessage({
    type: 'theme',
    mode: 'dark'  // or 'light'
  }, '*');
};

// Example: Update theme when user changes preference
function setTranslatorTheme(mode) {
  iframe.contentWindow.postMessage({
    type: 'theme',
    mode: mode  // 'light' or 'dark'
  }, '*');
}
</script>
```

### Message Format

#### Authentication Message

```javascript
{
  type: 'auth',
  token: '<jwt-token>'  // JWT token from your identity provider
}
```

The JWT token is validated by the backend using Microsoft Entra ID (Azure AD). Configure your tenant and client IDs in the backend environment:

```bash
TENANT_ID=your-azure-tenant-id
CLIENT_ID=your-azure-client-id
```

#### Theme Message

```javascript
{
  type: 'theme',
  mode: 'light' | 'dark'
}
```

### Microsoft Teams Integration

For Microsoft Teams tab integration:

1. Create a Teams app manifest
2. Add a configurable tab pointing to your translator URL
3. Use the Teams SDK to get the user's auth token:

```javascript
import * as microsoftTeams from '@microsoft/teams-js';

microsoftTeams.initialize();

microsoftTeams.authentication.getAuthToken({
  successCallback: (token) => {
    // Send token to iframe
    iframe.contentWindow.postMessage({
      type: 'auth',
      token: token
    }, '*');
  },
  failureCallback: (error) => {
    console.error('Auth failed:', error);
  }
});
```

### Standalone Mode (No Iframe)

When running standalone (not embedded), the frontend automatically falls back to using the `API_KEY` configured in the environment. This happens after a 1-second timeout if no authentication message is received from a parent window.

This means you can:
- Deploy the same build for both embedded and standalone use
- Test locally without setting up iframe infrastructure
- Use API key authentication for simple deployments

### Security Considerations

1. **Validate origin**: In production, validate the `event.origin` in postMessage handlers
2. **Use HTTPS**: Always deploy with HTTPS to protect tokens in transit
3. **Token expiry**: Implement token refresh logic in the parent application
4. **CORS**: Configure backend CORS to allow requests from your parent domain

---

## Language Settings

### First-Time Setup

After starting the application for the first time:

1. Navigate to `http://localhost:8080/settings`
2. Click **"Seed Languages"** to populate the database with all available Azure voices
3. This creates entries for 450+ language/locale combinations
4. 15 common languages are enabled by default

### Configuring Languages

For each language, you can configure:

| Setting | Options | Description |
|---------|---------|-------------|
| **Enabled** | On/Off | Whether the language appears in the translator |
| **Voice** | Multiple per language | Azure TTS voice for speech synthesis |
| **Transcription Model** | `azure_speech`, `promte_whisper` | Speech-to-text engine |
| **Translation Model** | `gpt4o-mini`, `promte_4o` | LLM for translation |
| **Summary Model** | `gpt4o-mini`, `promte_4o` | LLM for conversation recaps |

### Default Enabled Languages

These languages are enabled automatically when seeding:

- Arabic (Saudi Arabia), Danish, Dutch, English (UK/US)
- French, German, Italian, Polish, Portuguese
- Romanian, Spanish, Swedish, Turkish, Ukrainian

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/languages/` | GET | List all language settings |
| `/api/v1/languages/<code>` | GET/PUT | Get or update a specific language |
| `/api/v1/languages/bulk` | PUT | Bulk update multiple languages |
| `/api/v1/languages/seed` | POST | Seed database from Azure voices |
| `/api/v1/languages/enabled` | GET | List only enabled languages |

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't connect to MySQL server`

1. Verify MySQL is running:
   ```bash
   mysql -u translator_user -p -h localhost
   ```

2. Check firewall/security groups allow connections

3. For Azure MySQL, ensure SSL is configured:
   ```python
   # Already handled in python-be/src/db/sql.py
   "connect_args": {"ssl": {"ssl_verify_cert": True}}
   ```

### Azure Speech Not Working

**Error:** `Invalid subscription key`

1. Verify `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are correct
2. Check the Speech resource is in an active state
3. Verify the region supports your target languages

### Translation Quality Issues

1. Ensure you're using GPT-4o-mini (better than GPT-3.5 for translation)
2. Check the language codes match (e.g., `ar-EG` not `ar`)
3. Review prompts in `python-be/src/services/translation_service.py`

### Docker Build Failures

**Error:** `failed to solve: failed to fetch oauth token`

```bash
# Login to Docker Hub (if rate limited)
docker login

# Or use buildx with increased timeout
docker buildx create --use --name larger_log --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=10000000
```

### Frontend Not Loading

1. Check if static files are in `/app/src/static/`
2. Verify `index.html` exists after build
3. Check browser console for errors

---

## Getting Help

- Open an issue on GitHub
- Check Swagger docs at `/docs` for API reference
- Review logs: `docker logs <container-name>`
