# === CONFIG ===
API_IMAGE_NAME       := translator-api
FULL_IMAGE_NAME      := translator-full

# Load .env file if it exists (optional for local dev)
ifneq ("$(wildcard .env)","")
    include .env
    export
endif

# Azure Container Registry (ACR) - configure these in your .env file
ACR_NAME             ?= your-acr-name
AZURE_ACR_USERNAME   ?= $(ACR_NAME)
ACR_LOGIN_SERVER     := $(ACR_NAME).azurecr.io
ACR_REPO             ?= translator

# Final repository tags
API_IMAGE            := $(ACR_LOGIN_SERVER)/$(ACR_REPO)/$(API_IMAGE_NAME)
FULL_IMAGE           := $(ACR_LOGIN_SERVER)/$(ACR_REPO)/$(FULL_IMAGE_NAME)

# Azure deployment - configure these in your .env file
AZURE_WEBAPP_NAME    ?= your-webapp-name
AZURE_RESOURCE_GROUP ?= your-resource-group

# Build timestamp
BUILD_TIMESTAMP := $(shell date +%s)

# === PHONY TARGETS ===
.PHONY: dev test build-api build-full push-api push-full deploy-api deploy-full run-api run-full prune

## Local dev (no Docker) - Python only
dev:
	@echo "Running local dev with auto-reload..."
	@if [ ! -d "python-be/venv" ]; then python3 -m venv python-be/venv; fi
	@. python-be/venv/bin/activate; \
	  set -a; source .env; set +a; \
	  pip install --upgrade pip; \
	  pip install -r python-be/dev-requirements.txt; \
	  export FLASK_APP=src/app.py; \
	  export FLASK_ENV=development; \
	  python3 python-be/src/app.py

## 1) Run tests (Docker-based)
test:
	docker buildx build \
		--platform linux/amd64 \
		--no-cache \
		-f python-be/Dockerfile.test \
		-t $(API_IMAGE_NAME)-test \
		--load python-be
	docker run --rm $(API_IMAGE_NAME)-test

## 2) Build API-only image
build-api: test
	@echo "[✓] Tests passed. Building API-only image."
	docker buildx build \
		--platform linux/amd64 \
		--no-cache \
		-f Dockerfile.api-only \
		-t $(API_IMAGE_NAME) \
		--load .
	docker tag $(API_IMAGE_NAME) $(API_IMAGE):latest

## 3) Build Full (API + React) image
build-full: test
	@echo "[✓] Tests passed. Building FULL image (API + FE)."
	BUILD_TIMESTAMP=$$(date +%s); \
	docker buildx build \
		--platform linux/amd64 \
		--no-cache \
		--build-arg BUILD_TIMESTAMP=$$BUILD_TIMESTAMP \
		-f Dockerfile \
		-t $(FULL_IMAGE_NAME) \
		--load . && \
	docker tag $(FULL_IMAGE_NAME) $(FULL_IMAGE):latest

## 4) Push images
push-api:
	docker login $(ACR_LOGIN_SERVER) -u $(AZURE_ACR_USERNAME) -p $(AZURE_ACR_PASSWORD)
	docker push $(API_IMAGE):latest

push-full:
	docker login $(ACR_LOGIN_SERVER) -u $(AZURE_ACR_USERNAME) -p $(AZURE_ACR_PASSWORD)
	docker push $(FULL_IMAGE):latest

## 5) Deploy to Azure (API-only)
deploy-api: push-api
	az webapp config container set \
		--name $(AZURE_WEBAPP_NAME) \
		--resource-group $(AZURE_RESOURCE_GROUP) \
		--container-image-name $(API_IMAGE):latest \
		--container-registry-url https://$(ACR_LOGIN_SERVER) \
		--container-registry-user $(AZURE_ACR_USERNAME) \
		--container-registry-password $(AZURE_ACR_PASSWORD)
	az webapp restart \
		--name $(AZURE_WEBAPP_NAME) \
		--resource-group $(AZURE_RESOURCE_GROUP)

## 5b) Deploy to Azure (FULL)
deploy-full: push-full
	az webapp config container set \
		--name $(AZURE_WEBAPP_NAME) \
		--resource-group $(AZURE_RESOURCE_GROUP) \
		--container-image-name $(FULL_IMAGE):latest \
		--container-registry-url https://$(ACR_LOGIN_SERVER) \
		--container-registry-user $(AZURE_ACR_USERNAME) \
		--container-registry-password $(AZURE_ACR_PASSWORD)
	az webapp restart \
		--name $(AZURE_WEBAPP_NAME) \
		--resource-group $(AZURE_RESOURCE_GROUP)



## 6) Run images locally
run-api:
	docker run --rm --platform linux/amd64 -p 8080:80 --env-file .env \
		--name $(API_IMAGE_NAME)-container \
		$(API_IMAGE):latest

run-full:
	docker run --rm --platform linux/amd64 -p 8080:80 --env-file .env \
		--name $(FULL_IMAGE_NAME)-container \
		$(FULL_IMAGE):latest

## Prune Docker builder cache
prune:
	docker builder prune --force
