.PHONY: help dev dev-build dev-down dev-logs deploy destroy

# Default target
help: ## Show available commands
	@echo ""
	@echo "  Agent RAG — Command Reference"
	@echo "  ==============================="
	@echo ""
	@echo "  Local Development (Docker Compose):"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "    \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST) | grep -v deploy | grep -v destroy
	@echo ""
	@echo "  AWS Deployment (Terraform):"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "    \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST) | grep -E "deploy|destroy"
	@echo ""

# ── Local Development ──────────────────────────────────────────────────────────

dev: ## Build and start the full stack locally (http://localhost:8080)
	@echo "→ Starting local stack..."
	docker compose up --build -d
	@echo ""
	@echo "✓ App running at:  http://localhost:8080"
	@echo "✓ API docs at:     http://localhost:8000/docs"
	@echo ""
	@echo "  Logs: make dev-logs    |    Stop: make dev-down"

dev-build: ## Rebuild images without cache
	docker compose build --no-cache

dev-down: ## Stop and remove local containers
	docker compose down

dev-logs: ## Follow logs from all containers
	docker compose logs -f

# ── Cloud Deployment ─────────────────────────────────────────────────────────────

deploy: ## Interactive deployment (choose AWS or GCP)
	@bash deploy.sh

deploy-aws: ## Plan, apply, and deploy on AWS ECS
	@echo "→ Running AWS Terraform deployment..."
	@[ -f Terraform/aws/terraform.tfvars ] || { echo "✗ Missing Terraform/aws/terraform.tfvars — copy from terraform.tfvars.example"; exit 1; }
	cd Terraform/aws && terraform init
	cd Terraform/aws && terraform plan -out=tfplan
	@echo ""
	@read -p "  Apply the above AWS plan? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		cd Terraform/aws && terraform apply tfplan && bash deploy.sh; \
	else \
		echo "  Cancelled."; \
	fi

destroy-aws: ## Destroy AWS infrastructure
	@read -p "  Destroy ALL AWS resources? (yes/no): " confirm; \
	[ "$$confirm" = "yes" ] && cd Terraform/aws && terraform destroy || echo "  Cancelled."

deploy-gcp: ## Plan, apply, and deploy on GCP Cloud Run
	@echo "→ Running GCP Terraform deployment..."
	@[ -f Terraform/gcp/terraform.tfvars ] || { echo "✗ Missing Terraform/gcp/terraform.tfvars — copy from terraform.tfvars.example"; exit 1; }
	cd Terraform/gcp && terraform init
	cd Terraform/gcp && terraform plan -out=tfplan
	@echo ""
	@read -p "  Apply the above GCP plan? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		cd Terraform/gcp && terraform apply tfplan && bash deploy.sh; \
	else \
		echo "  Cancelled."; \
	fi

destroy-gcp: ## Destroy GCP infrastructure
	@read -p "  Destroy ALL GCP resources? (yes/no): " confirm; \
	[ "$$confirm" = "yes" ] && cd Terraform/gcp && terraform destroy || echo "  Cancelled."

