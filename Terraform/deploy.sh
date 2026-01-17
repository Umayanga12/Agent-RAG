#!/bin/bash

# Deployment script for RAG Chat Application to AWS
# This script automates the deployment process

set -e

echo "🚀 RAG Chat Application - AWS Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

command -v terraform >/dev/null 2>&1 || { echo -e "${RED}Error: terraform is not installed${NC}"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}Error: aws CLI is not installed${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: docker is not installed${NC}"; exit 1; }

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}Error: terraform.tfvars not found${NC}"
    echo "Please copy terraform.tfvars.example to terraform.tfvars and fill in your values"
    exit 1
fi

# Initialize Terraform
echo -e "\n${YELLOW}Initializing Terraform...${NC}"
terraform init

# Create infrastructure
echo -e "\n${YELLOW}Creating AWS infrastructure...${NC}"
echo "This will take approximately 10-15 minutes"
terraform apply

# Get outputs
echo -e "\n${YELLOW}Retrieving infrastructure details...${NC}"
ECR_BACKEND=$(terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND=$(terraform output -raw ecr_frontend_repository_url)
ECR_REGISTRY=$(echo $ECR_BACKEND | cut -d'/' -f1)
ALB_DNS=$(terraform output -raw alb_dns_name)
AWS_REGION=$(terraform output -raw aws_region || echo "us-east-1")

echo -e "${GREEN}✓ Infrastructure created${NC}"
echo "  Backend ECR: $ECR_BACKEND"
echo "  Frontend ECR: $ECR_FRONTEND"
echo "  ALB DNS: $ALB_DNS"

# Login to ECR
echo -e "\n${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
echo -e "${GREEN}✓ Logged into ECR${NC}"

# Build and push backend
echo -e "\n${YELLOW}Building backend Docker image...${NC}"
cd ../backend
docker build -t $ECR_BACKEND:latest .
echo -e "${GREEN}✓ Backend image built${NC}"

echo -e "\n${YELLOW}Pushing backend image to ECR...${NC}"
docker push $ECR_BACKEND:latest
echo -e "${GREEN}✓ Backend image pushed${NC}"

# Build and push frontend
echo -e "\n${YELLOW}Building frontend Docker image...${NC}"
cd ../frontend
docker build --build-arg VITE_API_URL=http://${ALB_DNS} -t $ECR_FRONTEND:latest .
echo -e "${GREEN}✓ Frontend image built${NC}"

echo -e "\n${YELLOW}Pushing frontend image to ECR...${NC}"
docker push $ECR_FRONTEND:latest
echo -e "${GREEN}✓ Frontend image pushed${NC}"

# Update ECS services
cd ../Terraform
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
BACKEND_SERVICE=$(terraform output -raw backend_service_name)
FRONTEND_SERVICE=$(terraform output -raw frontend_service_name)

echo -e "\n${YELLOW}Deploying backend service...${NC}"
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $BACKEND_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION \
  --no-cli-pager
echo -e "${GREEN}✓ Backend service deployment initiated${NC}"

echo -e "\n${YELLOW}Deploying frontend service...${NC}"
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $FRONTEND_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION \
  --no-cli-pager
echo -e "${GREEN}✓ Frontend service deployment initiated${NC}"

# Wait for services to stabilize
echo -e "\n${YELLOW}Waiting for services to become healthy (this may take 2-3 minutes)...${NC}"
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $BACKEND_SERVICE --region $AWS_REGION
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $FRONTEND_SERVICE --region $AWS_REGION

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nYour application is now accessible at:"
echo -e "${GREEN}$(terraform output -raw application_url)${NC}"
echo -e "\n${YELLOW}Share this URL with anyone you want to give access.${NC}"
echo -e "\nAPI Documentation: ${GREEN}http://${ALB_DNS}/docs${NC}"
echo -e "\nTo view logs:"
echo -e "  Backend:  aws logs tail $(terraform output -raw cloudwatch_log_group_backend) --follow"
echo -e "  Frontend: aws logs tail $(terraform output -raw cloudwatch_log_group_frontend) --follow"
echo -e "\n${YELLOW}Note: The application URL is unlisted - only people with the link can access it.${NC}"
