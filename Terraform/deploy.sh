#!/bin/bash

# deploy.sh — Build, push Docker images and update ECS services.
# Run AFTER `make deploy` has provisioned the AWS infrastructure via Terraform.
# Usage: cd Terraform && bash deploy.sh

set -e

echo "🚀 Agent RAG — Docker Build & ECS Deploy"
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Prerequisites ──────────────────────────────────────────────────────────────

echo -e "\n${YELLOW}Checking prerequisites...${NC}"
command -v aws    >/dev/null 2>&1 || { echo -e "${RED}✗ aws CLI not installed${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}✗ docker not installed${NC}"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}✗ terraform not installed${NC}"; exit 1; }

if [ ! -f "terraform.tfvars" ]; then
  echo -e "${RED}✗ terraform.tfvars not found.${NC}"
  echo "  Copy Terraform/terraform.tfvars.example → Terraform/terraform.tfvars and fill in values."
  exit 1
fi

if ! terraform output ecs_cluster_name >/dev/null 2>&1; then
  echo -e "${RED}✗ Terraform outputs not available.${NC}"
  echo "  Run 'make deploy' first to provision AWS infrastructure."
  exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"

# ── Read Terraform outputs ─────────────────────────────────────────────────────

echo -e "\n${YELLOW}Reading infrastructure details from Terraform...${NC}"
ECR_BACKEND=$(terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND=$(terraform output -raw ecr_frontend_repository_url)
ECR_REGISTRY=$(echo "$ECR_BACKEND" | cut -d'/' -f1)
ALB_DNS=$(terraform output -raw alb_dns_name)
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
BACKEND_SERVICE=$(terraform output -raw backend_service_name)
FRONTEND_SERVICE=$(terraform output -raw frontend_service_name)

echo -e "  Backend ECR:  $ECR_BACKEND"
echo -e "  Frontend ECR: $ECR_FRONTEND"
echo -e "  ALB DNS:      $ALB_DNS"

# ── ECR Login ─────────────────────────────────────────────────────────────────

echo -e "\n${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"
echo -e "${GREEN}✓ Logged into ECR${NC}"

# ── Build & push backend ───────────────────────────────────────────────────────

echo -e "\n${YELLOW}Building backend image...${NC}"
docker build -t "$ECR_BACKEND:latest" ../backend
docker push "$ECR_BACKEND:latest"
echo -e "${GREEN}✓ Backend image pushed${NC}"

# ── Build & push frontend ──────────────────────────────────────────────────────

echo -e "\n${YELLOW}Building frontend image...${NC}"
docker build \
  --build-arg "VITE_API_URL=http://${ALB_DNS}" \
  -t "$ECR_FRONTEND:latest" \
  ../frontend
docker push "$ECR_FRONTEND:latest"
echo -e "${GREEN}✓ Frontend image pushed${NC}"

# ── Force new ECS deployments ──────────────────────────────────────────────────

echo -e "\n${YELLOW}Triggering ECS deployments...${NC}"
aws ecs update-service \
  --cluster "$CLUSTER_NAME" --service "$BACKEND_SERVICE" \
  --force-new-deployment --region "$AWS_REGION" --no-cli-pager >/dev/null
aws ecs update-service \
  --cluster "$CLUSTER_NAME" --service "$FRONTEND_SERVICE" \
  --force-new-deployment --region "$AWS_REGION" --no-cli-pager >/dev/null

echo -e "\n${YELLOW}Waiting for services to stabilise (≈2-3 min)...${NC}"
aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services "$BACKEND_SERVICE" "$FRONTEND_SERVICE" \
  --region "$AWS_REGION"

# ── Done ───────────────────────────────────────────────────────────────────────

APP_URL=$(terraform output -raw application_url)
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n  App:  ${GREEN}${APP_URL}${NC}"
echo -e "  API docs: ${GREEN}http://${ALB_DNS}/docs${NC}"
echo -e "\n  Logs:"
echo -e "    Backend:  aws logs tail $(terraform output -raw cloudwatch_log_group_backend) --follow"
echo -e "    Frontend: aws logs tail $(terraform output -raw cloudwatch_log_group_frontend) --follow"
