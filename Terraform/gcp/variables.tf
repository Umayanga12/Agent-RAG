variable "gcp_project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "gcp_region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "rag-chat-app"
}

# Backend Configuration
variable "backend_container_port" {
  description = "Port on which backend container listens"
  type        = number
  default     = 8080
}

# API Keys
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "pinecone_api_key" {
  description = "Pinecone API key"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Gemini API key"
  type        = string
  sensitive   = true
}

# Pinecone Configuration
variable "pinecone_environment" {
  description = "Pinecone environment"
  type        = string
  default     = "us-east-1-aws"
}

variable "pinecone_index_name" {
  description = "Pinecone index name"
  type        = string
  default     = "law"
}
