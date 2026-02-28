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

# ── AWS Deployment ─────────────────────────────────────────────────────────────

deploy: ## Plan then apply Terraform to deploy on AWS ECS
	@echo "→ Running Terraform deployment..."
	@[ -f Terraform/terraform.tfvars ] || { echo "✗ Missing Terraform/terraform.tfvars — copy from terraform.tfvars.example"; exit 1; }
	cd Terraform && terraform init
	cd Terraform && terraform plan -out=tfplan
	@echo ""
	@read -p "  Apply the above plan? (yes/no): " confirm; \
	[ "$$confirm" = "yes" ] && cd Terraform && terraform apply tfplan || echo "  Cancelled."
	cd Terraform && bash deploy.sh

destroy: ## Destroy all AWS infrastructure (irreversible!)
	@read -p "  Destroy ALL AWS resources? (yes/no): " confirm; \
	[ "$$confirm" = "yes" ] && cd Terraform && terraform destroy || echo "  Cancelled."
