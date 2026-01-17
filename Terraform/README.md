# AWS Deployment with Terraform

This directory contains Terraform configuration to deploy your RAG Chat Application to AWS. The application will be accessible to anyone who has the link (unlisted, not publicly advertised).

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with public and private subnets across 2 availability zones
- **ECS Fargate**: Serverless container orchestration for frontend and backend
- **Application Load Balancer**: Routes traffic to frontend and backend services
- **ECR**: Container registries for Docker images
- **S3**: Bucket for PDF file uploads
- **Secrets Manager**: Secure storage for API keys
- **CloudWatch**: Logging and monitoring
- **Auto Scaling**: Automatic scaling based on CPU/memory utilization

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI
   ```bash
   aws configure
   ```
3. **Terraform**: Install Terraform (>= 1.0)
   ```bash
   # On macOS
   brew install terraform
   
   # On Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```
4. **Docker**: Install Docker for building images
5. **API Keys**: 
   - OpenAI API key
   - Pinecone API key and configured index

## Deployment Steps

### 1. Configure Variables

Copy the example variables file and fill in your values:

```bash
cd Terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `openai_api_key`: Your OpenAI API key
- `pinecone_api_key`: Your Pinecone API key
- `pinecone_index_name`: Your Pinecone index name
- Other optional configurations

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

This shows what resources will be created.

### 4. Apply Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This will create:
- VPC and networking (2-3 minutes)
- ECR repositories (1 minute)
- ECS cluster and services (2-3 minutes)
- Load balancer (2-3 minutes)
- Other resources

**Total deployment time: ~10-15 minutes**

### 5. Build and Push Docker Images

After infrastructure is created, get the ECR repository URLs:

```bash
terraform output ecr_backend_repository_url
terraform output ecr_frontend_repository_url
```

#### Build and Push Backend

```bash
# Get ECR login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_backend_repository_url | cut -d'/' -f1)

# Build backend image
cd ../backend
docker build -t $(terraform -chdir=../Terraform output -raw ecr_backend_repository_url):latest .

# Push to ECR
docker push $(terraform -chdir=../Terraform output -raw ecr_backend_repository_url):latest
```

#### Build and Push Frontend

```bash
# Build frontend image with API URL
cd ../frontend
ALB_DNS=$(terraform -chdir=../Terraform output -raw alb_dns_name)
docker build --build-arg VITE_API_URL=http://${ALB_DNS} -t $(terraform -chdir=../Terraform output -raw ecr_frontend_repository_url):latest .

# Push to ECR
docker push $(terraform -chdir=../Terraform output -raw ecr_frontend_repository_url):latest
```

### 6. Force Service Update

After pushing Docker images, force ECS to deploy them:

```bash
cd ../Terraform

# Update backend service
aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw backend_service_name) \
  --force-new-deployment \
  --region us-east-1

# Update frontend service
aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw frontend_service_name) \
  --force-new-deployment \
  --region us-east-1
```

### 7. Access Your Application

Get your application URL:

```bash
terraform output application_url
```

**Important**: Share this URL with anyone you want to give access. The application is not publicly listed or searchable - it's only accessible via the direct link.

Example URL: `http://rag-chat-app-alb-1234567890.us-east-1.elb.amazonaws.com`

## Monitoring

### View Logs

```bash
# Backend logs
aws logs tail $(terraform output -raw cloudwatch_log_group_backend) --follow

# Frontend logs
aws logs tail $(terraform output -raw cloudwatch_log_group_frontend) --follow
```

### Check Service Status

```bash
# List running tasks
aws ecs list-tasks --cluster $(terraform output -raw ecs_cluster_name)

# Describe backend service
aws ecs describe-services \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --services $(terraform output -raw backend_service_name)
```

### View CloudWatch Metrics

Go to AWS Console → CloudWatch → Dashboards to view:
- ECS CPU/Memory utilization
- ALB request counts
- Target health
- Application errors

## Updating the Application

### Update Backend Code

```bash
cd backend
docker build -t $(terraform -chdir=../Terraform output -raw ecr_backend_repository_url):latest .
docker push $(terraform -chdir=../Terraform output -raw ecr_backend_repository_url):latest

aws ecs update-service \
  --cluster $(terraform -chdir=../Terraform output -raw ecs_cluster_name) \
  --service $(terraform -chdir=../Terraform output -raw backend_service_name) \
  --force-new-deployment
```

### Update Frontend Code

```bash
cd frontend
ALB_DNS=$(terraform -chdir=../Terraform output -raw alb_dns_name)
docker build --build-arg VITE_API_URL=http://${ALB_DNS} -t $(terraform -chdir=../Terraform output -raw ecr_frontend_repository_url):latest .
docker push $(terraform -chdir=../Terraform output -raw ecr_frontend_repository_url):latest

aws ecs update-service \
  --cluster $(terraform -chdir=../Terraform output -raw ecs_cluster_name) \
  --service $(terraform -chdir=../Terraform output -raw frontend_service_name) \
  --force-new-deployment
```

## Cost Optimization

Estimated monthly costs (us-east-1):
- **ECS Fargate**: ~$50-100/month (2 backend + 2 frontend tasks)
- **Application Load Balancer**: ~$16/month
- **NAT Gateways**: ~$64/month (2 AZs)
- **Data Transfer**: Variable
- **CloudWatch Logs**: ~$5/month
- **S3 Storage**: ~$1/month

**Total: ~$140-190/month**

### Cost Saving Tips:

1. **Reduce to 1 AZ** (dev/test only):
   ```hcl
   availability_zones = ["us-east-1a"]
   ```
   Saves ~$32/month (1 NAT Gateway)

2. **Reduce task count**:
   ```hcl
   backend_desired_count = 1
   ```

3. **Use smaller instances**:
   ```hcl
   backend_cpu = 512
   backend_memory = 1024
   ```

4. **Enable auto-shutdown** during off-hours (requires additional setup)

## Troubleshooting

### Services Not Starting

Check task logs:
```bash
aws logs tail /ecs/rag-chat-app-backend --follow
```

Common issues:
- Missing environment variables
- Invalid API keys in Secrets Manager
- Container health check failures

### 502 Bad Gateway

This usually means:
- Backend is not running or unhealthy
- Security groups blocking traffic
- Container taking too long to start

Check target health:
```bash
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups --names rag-chat-app-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text)
```

### Can't Push to ECR

Re-authenticate:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_backend_repository_url | cut -d'/' -f1)
```

## Cleanup

To destroy all resources and avoid charges:

```bash
cd Terraform
terraform destroy
```

Type `yes` when prompted.

**Warning**: This will delete all resources including uploaded files in S3.

## Security Best Practices

1. **Enable HTTPS**: Get an ACM certificate and update `certificate_arn` variable
2. **Restrict CORS**: Update CORS origins in `api.py` to your specific domain
3. **Enable VPC Flow Logs**: For network traffic analysis
4. **Regular Updates**: Keep dependencies and base images updated
5. **Secrets Rotation**: Rotate API keys periodically
6. **Backup S3**: Enable versioning and cross-region replication if needed

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS Console for resource status
3. Verify Terraform state: `terraform show`

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Application Load Balancer Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
