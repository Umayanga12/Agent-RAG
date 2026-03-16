# Output values after infrastructure deployment

output "backend_api_url" {
  description = "Backend API URL"
  value       = "${google_cloud_run_v2_service.backend.uri}/docs"
}

output "application_url" {
  description = "External URL of the Frontend Application"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.gcp_project_id
}

output "region" {
  description = "GCP Region"
  value       = var.gcp_region
}

output "artifact_registry_path" {
  description = "Artifact Registry Docker Repository Location"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.repo.name}"
}

output "backend_service_name" {
  description = "Cloud Run backend service name"
  value       = google_cloud_run_v2_service.backend.name
}

output "frontend_service_name" {
  description = "Cloud Run frontend service name"
  value       = google_cloud_run_v2_service.frontend.name
}

output "uploads_bucket" {
  description = "Cloud Storage uploads bucket"
  value       = google_storage_bucket.uploads.name
}
