# Require Cloud Run API
resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

data "google_project" "project" {}

# Create a dedicated Service Account for the App
resource "google_service_account" "app_sa" {
  account_id   = "${var.project_name}-sa"
  display_name = "Cloud Run App Service Account"
}

# Grant the service account access to Secret Manager
resource "google_project_iam_member" "secret_accessor" {
  project = data.google_project.project.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# Backend Service
resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.project_name}-backend"
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.app_sa.email

    containers {
      # Use a placeholder initially until deployed by deploy.sh
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      
      ports {
        container_port = var.backend_container_port
      }
      



      env {
        name  = "PINECONE_ENVIRONMENT"
        value = var.pinecone_environment
      }
      env {
        name  = "PINECONE_INDEX_NAME"
        value = var.pinecone_index_name
      }
      env {
        name  = "AWS_REGION" # May be expected by the app even when on GCP
        value = var.gcp_region
      }
      env {
        name  = "S3_UPLOAD_BUCKET" # Assuming app may map this to GCS if on GCP or use as is
        value = google_storage_bucket.uploads.name
      }
      
      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.openai_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "PINECONE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.pinecone_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image, # Ignore image changes managed by deploy.sh
    ]
  }

  depends_on = [
    google_project_service.run,
    google_project_iam_member.secret_accessor,
    google_secret_manager_secret_version.openai_api_key,
    google_secret_manager_secret_version.pinecone_api_key,
    google_secret_manager_secret_version.gemini_api_key
  ]
}

# Allow unauthenticated access (since it's a web app)
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = google_cloud_run_v2_service.backend.project
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Frontend Service
resource "google_cloud_run_v2_service" "frontend" {
  name     = "${var.project_name}-frontend"
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.app_sa.email
    
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder
      
      ports {
        container_port = 8080
      }
      
      env {
        name  = "VITE_API_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image, # Ignore image changes managed by deploy.sh
    ]
  }

  depends_on = [
    google_project_service.run,
    google_cloud_run_v2_service.backend
  ]
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = google_cloud_run_v2_service.frontend.project
  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
