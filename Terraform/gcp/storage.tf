# Random string to ensure bucket name uniqueness globally
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "google_storage_bucket" "uploads" {
  name          = "${var.project_name}-uploads-${random_string.bucket_suffix.result}"
  location      = var.gcp_region
  force_destroy = true # Allows deleting the bucket even if it contains objects

  uniform_bucket_level_access = true

  # Set lifecycle rules if needed (e.g. delete after X days)
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    environment = var.environment
  }
}
