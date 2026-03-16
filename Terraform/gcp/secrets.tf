# Require Secret Manager API
resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# OpenAI API Key
resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "${var.project_name}-openai-api-key"
  replication {
    auto {}
  }

  labels = {
    environment = var.environment
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key
}

# Pinecone API Key
resource "google_secret_manager_secret" "pinecone_api_key" {
  secret_id = "${var.project_name}-pinecone-api-key"
  replication {
    auto {}
  }

  labels = {
    environment = var.environment
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "pinecone_api_key" {
  secret = google_secret_manager_secret.pinecone_api_key.id
  secret_data = var.pinecone_api_key
}
