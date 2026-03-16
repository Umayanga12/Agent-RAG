#!/bin/bash

# Root deploy script providing interactive provider selection

echo "==================================="
echo " Agent RAG — Multi-Cloud Deployment"
echo "==================================="
echo ""
echo "Please select a cloud provider for deployment:"
echo "  1) AWS (ECS Fargate + Application Load Balancer)"
echo "  2) GCP (Cloud Run + Artifact Registry)"
echo ""
read -p "Enter choice [1 or 2]: " choice

if [ "$choice" == "1" ]; then
    echo "→ Proceeding with AWS Deployment..."
    make deploy-aws
elif [ "$choice" == "2" ]; then
    echo "→ Proceeding with GCP Deployment..."
    make deploy-gcp
else
    echo "Invalid choice. Exiting."
    exit 1
fi
