resource "google_project_service" "artifactregistry" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Artifact Registry Repository for Docker Images
resource "google_artifact_registry_repository" "repo" {
  location      = var.gcp_region
  repository_id = "${var.project_name}-repo"
  description   = "Docker repository for ${var.project_name} images"
  format        = "DOCKER"

  labels = {
    environment = var.environment
  }

  depends_on = [google_project_service.artifactregistry]
}
