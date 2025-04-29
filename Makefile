# Makefile for Bookstore Microservices Deployment
# Author: lazydev7

# Include environment variables from .env file (only once)
include .env
export $(shell sed 's/=.*//' .env)

# Docker configuration
DOCKER_USERNAME=lazydev7

# Service names and their corresponding image names
WEB_BFF=bookstore-web-bff
MOBILE_BFF=bookstore-mobile-bff
CUSTOMER_SERVICE=customer-service
BOOK_COMMAND_SERVICE=book-command-service
BOOK_QUERY_SERVICE=book-query-service
CRM_SERVICE=crm-service
DB_SYNC=db-sync

# Image tags
TAG=latest

# Temp files
SQL_SETUP_FILE=setup.sql
REMOTE_SQL_SETUP_FILE=/tmp/setup.sql

# K8s directory
K8S_DIR=./kubernetes
REMOTE_K8S_DIR=~/kubernetes

.PHONY: all build push deploy clean test setup-db logs ec2 logout check-env update

# Default target
all: check-env setup-db build push ec2 clean

update: check-env setup-db build push patch

clear-all-dbs: setup-db clear-mongodb

# Check required environment variables
check-env:
	@echo "Checking required environment variables..."
	@: $(if $(SSH_KEY_PATH),,$(error SSH_KEY_PATH is not set))
	@: $(if $(EC2_K8S_ACCESS),,$(error EC2_K8S_ACCESS is not set))
	@: $(if $(RDS_HOST),,$(error RDS_HOST is not set))
	@: $(if $(RDS_USER),,$(error RDS_USER is not set))
	@: $(if $(RDS_PASSWORD),,$(error RDS_PASSWORD is not set))
	@: $(if $(RDS_DATABASE),,$(error RDS_DATABASE is not set))
	@: $(if $(MONGODB_URI),,$(error RDS_DATABASE is not set))
	@echo "All required environment variables set."

# Set up database
setup-db:
	@echo "Setting up database..."
	@echo "Creating setup.sql with schema definition..."

	@echo "Creating DB..."
	@echo "CREATE DATABASE IF NOT EXISTS bookstore DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;" > $(SQL_SETUP_FILE)
	@echo "USE $(RDS_DATABASE);" >> $(SQL_SETUP_FILE)

	# Create books table
	@echo "CREATE TABLE IF NOT EXISTS books (" >> $(SQL_SETUP_FILE)
	@echo "  ISBN VARCHAR(20) PRIMARY KEY," >> $(SQL_SETUP_FILE)
	@echo "  title VARCHAR(255) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  Author VARCHAR(255) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  description TEXT NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  genre VARCHAR(100) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  price DECIMAL(10,2) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  quantity INT NOT NULL" >> $(SQL_SETUP_FILE)
	@echo ");" >> $(SQL_SETUP_FILE)
	@echo "" >> $(SQL_SETUP_FILE)

	# Create customers table
	@echo "CREATE TABLE IF NOT EXISTS customers (" >> $(SQL_SETUP_FILE)
	@echo "  id INT AUTO_INCREMENT PRIMARY KEY," >> $(SQL_SETUP_FILE)
	@echo "  userId VARCHAR(255) UNIQUE NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  name VARCHAR(255) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  phone VARCHAR(20) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  address VARCHAR(255) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  address2 VARCHAR(255)," >> $(SQL_SETUP_FILE)
	@echo "  city VARCHAR(100) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  state CHAR(2) NOT NULL," >> $(SQL_SETUP_FILE)
	@echo "  zipcode VARCHAR(10) NOT NULL" >> $(SQL_SETUP_FILE)
	@echo ");" >> $(SQL_SETUP_FILE)

	# Clear tables if they exist
	@echo "DELETE FROM customers;" >> $(SQL_SETUP_FILE)
	@echo "DELETE FROM books;" >> $(SQL_SETUP_FILE)
	@echo "" >> $(SQL_SETUP_FILE)

	@echo "Copying setup.sql to EC2..."
	scp -i $(SSH_KEY_PATH) $(SQL_SETUP_FILE) ec2-user@$(EC2_K8S_ACCESS):$(REMOTE_SQL_SETUP_FILE) || (echo "Failed to copy SQL file to EC2"; exit 1)

	@echo "Executing SQL script on RDS..."
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) 'mysql -h $(RDS_HOST) -u $(RDS_USER) --password="$(RDS_PASSWORD)" < $(REMOTE_SQL_SETUP_FILE) && rm -f $(REMOTE_SQL_SETUP_FILE)' || (echo "Failed to execute SQL script"; exit 1)

	@echo "Database setup complete."

# Build all Docker images
build:
	@echo "Building Docker images..."
	@for service in $(WEB_BFF) $(MOBILE_BFF) $(CUSTOMER_SERVICE) $(CRM_SERVICE) $(BOOK_COMMAND_SERVICE) $(BOOK_QUERY_SERVICE) $(DB_SYNC); do \
		echo "Building $$service..."; \
		docker build --platform linux/amd64 -t $(DOCKER_USERNAME)/$$service:$(TAG) ./$$service || (echo "Failed to build $$service"; exit 1); \
	done
	@echo "All images built successfully."

# Push Docker images to Docker Hub
push:
	@echo "Logging in to Docker Hub..."
	@docker login --username $(DOCKER_USERNAME) || (echo "Failed to log in to Docker Hub"; exit 1)

	@echo "Pushing images to Docker Hub..."
	@for service in $(WEB_BFF) $(MOBILE_BFF) $(CUSTOMER_SERVICE) $(CRM_SERVICE) $(BOOK_COMMAND_SERVICE) $(BOOK_QUERY_SERVICE) $(DB_SYNC); do \
		echo "Pushing $$service..."; \
		docker push $(DOCKER_USERNAME)/$$service:$(TAG) || (echo "Failed to push $$service"; exit 1); \
	done

	@echo "All images pushed to Docker Hub."
	@$(MAKE) logout


# Process Kubernetes templates with environment variable substitution
process-k8s-templates:
	@echo "Processing Kubernetes templates..."
	@mkdir -p $(K8S_DIR)/processed
	@for file in $(shell find $(K8S_DIR) -name "*.yaml" -not -path "$(K8S_DIR)/processed/*" -not -name "secrets.yaml"); do \
		sed -e "s|\$${DOCKER_USERNAME}|$(DOCKER_USERNAME)|g" \
			-e "s|\$${TAG}|$(TAG)|g" \
			-e "s|\$${RDS_HOST}|$(RDS_HOST)|g" \
			-e "s|\$${RDS_DATABASE}|$(RDS_DATABASE)|g" \
			-e "s|\$${ANDREW_ID}|$(ANDREW_ID)|g" \
			$$file > $(K8S_DIR)/processed/$$(basename $$file); \
	done
	@cp $(K8S_DIR)/secrets.yaml $(K8S_DIR)/processed/secrets.yaml
	@echo "Processed Kubernetes templates."

# Deploy to Kubernetes
ec2: process-k8s-templates
	@echo "Deploying to Kubernetes via EC2..."

	# Copy processed Kubernetes files to EC2
	scp -i $(SSH_KEY_PATH) -r $(K8S_DIR)/processed/* ec2-user@$(EC2_K8S_ACCESS):$(REMOTE_K8S_DIR)/ || (echo "Failed to copy Kubernetes files"; exit 1)

	# Apply Kubernetes configurations in correct order
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl apply -f $(REMOTE_K8S_DIR)/namespace.yaml" || (echo "Failed to create namespace"; exit 1)
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl apply -f $(REMOTE_K8S_DIR)/secrets.yaml" || (echo "Failed to create secrets"; exit 1)
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl apply -f $(REMOTE_K8S_DIR) -n bookstore-ns" || (echo "Failed to apply configurations"; exit 1)

	@echo "Successfully applied all Kubernetes configurations."

	# Get LoadBalancer URLs for documentation
	@echo "Retrieving service URLs..."
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "echo 'Web BFF URL: ' && kubectl get svc bookstore-web-bff -n bookstore-ns -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "echo 'Mobile BFF URL: ' && kubectl get svc bookstore-mobile-bff -n bookstore-ns -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"

	# Create url.txt file for submission
	@echo "Creating url.txt file..."
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl get svc bookstore-web-bff -n bookstore-ns -o jsonpath='http://{.status.loadBalancer.ingress[0].hostname}:80\n' > url.txt"
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl get svc bookstore-mobile-bff -n bookstore-ns -o jsonpath='http://{.status.loadBalancer.ingress[0].hostname}:80\n' >> url.txt"
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "echo '$(ANDREW_ID)' >> url.txt"
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "echo '$(EMAIL_USER)' >> url.txt"

	# Copy url.txt back to local machine
	scp -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS):url.txt ./url.txt || (echo "Failed to retrieve url.txt"; exit 1)

	@echo "Deployment complete. See url.txt for service URLs."

# Logout from Docker Hub
logout:
	@echo "Logging out from Docker Hub..."
	@docker logout || true

# Clean up temporary files
clean:
	@echo "Cleaning up temporary files..."
	@rm -f $(SQL_SETUP_FILE)
	@rm -rf $(K8S_DIR)/processed
	@ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "rm -f $(REMOTE_SQL_SETUP_FILE)" || true
	@echo "Cleanup complete."

# View pod logs
logs:
	@echo "Fetching pod logs..."
	@echo "Which service logs do you want to see? Options: web-bff, mobile-bff, customer-service, book-service, crm-service"
	@read service; \
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl logs -l app=$$service -n bookstore-ns --tail=100 -f"

#update k8s images
patch: process-k8s-templates
	@echo "Updating K8s Images..."
	# Copy processed Kubernetes files to EC2
	scp -i $(SSH_KEY_PATH) -r $(K8S_DIR)/processed/* ec2-user@$(EC2_K8S_ACCESS):$(REMOTE_K8S_DIR)/ || (echo "Failed to copy Kubernetes files"; exit 1)
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl apply -f $(REMOTE_K8S_DIR) -n bookstore-ns" || (echo "Failed to apply configurations"; exit 1)
	ssh -i $(SSH_KEY_PATH) ec2-user@$(EC2_K8S_ACCESS) "kubectl rollout restart deployment -n bookstore-ns" || (echo "Failed to restart deployments"; exit 1)
	@echo "Successfully updated all kubernetes images"

# Clear MongoDB collection
clear-mongodb:
	@echo "Clearing MongoDB collection books_jfadiji..."
	@node clear-mongodb.js
