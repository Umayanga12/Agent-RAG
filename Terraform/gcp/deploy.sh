#!/bin/bash

# deploy.sh — Build, push Docker images and update Cloud Run services.
# Run AFTER `make deploy-gcp` has provisioned the GCP infrastructure via Terraform.
# Usage: cd Terraform/gcp && bash deploy.sh

set -e

echo "🚀 Agent RAG — GCP Docker Build & Cloud Run Deploy"
echo "=================================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Prerequisites ──────────────────────────────────────────────────────────────

echo -e "\n${YELLOW}Checking prerequisites...${NC}"
command -v gcloud    >/dev/null 2>&1 || { echo -e "${RED}✗ gcloud CLI not installed${NC}"; exit 1; }
command -v docker    >/dev/null 2>&1 || { echo -e "${RED}✗ docker not installed${NC}"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}✗ terraform not installed${NC}"; exit 1; }

if [ ! -f "terraform.tfvars" ]; then
  echo -e "${RED}✗ terraform.tfvars not found.${NC}"
  echo "  Copy Terraform/gcp/terraform.tfvars.example → Terraform/gcp/terraform.tfvars and fill in values."
  exit 1
fi

if [ "$(terraform output -json)" = "{}" ]; then
  echo -e "${RED}✗ Terraform outputs not available.${NC}"
  echo "  Run 'make deploy-gcp' first to provision GCP infrastructure."
  exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"

# ── Read Terraform outputs ─────────────────────────────────────────────────────

echo -e "\n${YELLOW}Reading infrastructure details from Terraform...${NC}"
PROJECT_ID=$(terraform output -raw project_id 2>/dev/null)
REGION=$(terraform output -raw region 2>/dev/null)
AR_PATH=$(terraform output -raw artifact_registry_path 2>/dev/null)
BACKEND_SERVICE=$(terraform output -raw backend_service_name 2>/dev/null)
FRONTEND_SERVICE=$(terraform output -raw frontend_service_name 2>/dev/null)
BACKEND_IMAGE="${AR_PATH}/${BACKEND_SERVICE}:latest"
FRONTEND_IMAGE="${AR_PATH}/${FRONTEND_SERVICE}:latest"

echo -e "  Project ID:        $PROJECT_ID"
echo -e "  Region:            $REGION"
echo -e "  Artifact Registry: $AR_PATH"
echo -e "  Backend Image:     $BACKEND_IMAGE"
echo -e "  Frontend Image:    $FRONTEND_IMAGE"

# ── Docker Auth ────────────────────────────────────────────────────────────────

echo -e "\n${YELLOW}Configuring Docker authentication for Artifact Registry...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
echo -e "${GREEN}✓ Docker auth configured${NC}"

# ── Build & push backend ───────────────────────────────────────────────────────

echo -e "\n${YELLOW}Building backend image...${NC}"
docker build -t "$BACKEND_IMAGE" ../../backend
docker push "$BACKEND_IMAGE"
echo -e "${GREEN}✓ Backend image pushed${NC}"

# ── Deploy backend to Cloud Run ────────────────────────────────────────────────

echo -e "\n${YELLOW}Deploying backend to Cloud Run...${NC}"
gcloud run deploy "$BACKEND_SERVICE" \
  --image "$BACKEND_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --port 8080 \
  --quiet

BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')
echo -e "${GREEN}✓ Backend deployed at $BACKEND_URL${NC}"

# ── Build & push frontend ──────────────────────────────────────────────────────

echo -e "\n${YELLOW}Building frontend image...${NC}"
docker build \
  --build-arg "VITE_API_URL=${BACKEND_URL}" \
  -t "$FRONTEND_IMAGE" \
  ../../frontend
docker push "$FRONTEND_IMAGE"
echo -e "${GREEN}✓ Frontend image pushed${NC}"

# ── Deploy frontend to Cloud Run ────────────────────────────────────────────────

echo -e "\n${YELLOW}Deploying frontend to Cloud Run...${NC}"
gcloud run deploy "$FRONTEND_SERVICE" \
  --image "$FRONTEND_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --quiet

FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')

# ── Done ───────────────────────────────────────────────────────────────────────

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 GCP Deployment successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n  App:  ${GREEN}${FRONTEND_URL}${NC}"
echo -e "  API docs: ${GREEN}${BACKEND_URL}/docs${NC}"
echo -e "\n  Logs: View in GCP Cloud Console (Cloud Run -> Logs)"
