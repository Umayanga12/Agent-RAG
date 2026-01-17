# Secrets Manager for sensitive configuration

# OpenAI API Key
resource "aws_secretsmanager_secret" "openai_api_key" {
  name                    = "${var.project_name}-openai-api-key"
  description             = "OpenAI API key for RAG application"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-openai-api-key"
  }
}

resource "aws_secretsmanager_secret_version" "openai_api_key" {
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = var.openai_api_key
}

# Pinecone API Key
resource "aws_secretsmanager_secret" "pinecone_api_key" {
  name                    = "${var.project_name}-pinecone-api-key"
  description             = "Pinecone API key for vector database"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-pinecone-api-key"
  }
}

resource "aws_secretsmanager_secret_version" "pinecone_api_key" {
  secret_id     = aws_secretsmanager_secret.pinecone_api_key.id
  secret_string = var.pinecone_api_key
}
