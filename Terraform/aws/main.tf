terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # backend "s3" {
  #   # Configure your S3 backend for storing Terraform state
  #   bucket = "rag-agent"
  #   key    = "statFile"
  #   region = "us-east-1"
  #   # dynamodb_table = "terraform-state-lock"  # Uncomment if using state locking
  #   encrypt = true
  # }
  
  # Using local backend for development
  # Uncomment the S3 backend above when you have AWS credentials configured
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "rag-chat-application"
      ManagedBy   = "Terraform"
    }
  }
}
