#!/bin/bash

# Appesso Production Deployment Script
# Author: Claude
# Date: 2024

set -e  # Exit on error

echo "🚀 Starting Appesso Production Deployment..."

# Server details
SERVER_IP="119.91.209.91"
SERVER_USER="ubuntu"
SERVER_PASSWORD="AAaa@@85817920"
PROJECT_DIR="/var/www/appesso"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Step 1: Installing system dependencies...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib sshpass

echo -e "${GREEN}Step 2: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo -e "${GREEN}Step 3: Installing PM2 globally...${NC}"
sudo npm install -g pm2

echo -e "${GREEN}Step 4: Creating project directory...${NC}"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $SERVER_USER:$SERVER_USER $PROJECT_DIR

echo -e "${GREEN}Step 5: Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << EOF
CREATE USER appesso WITH PASSWORD 'AppessoDb2024!';
CREATE DATABASE appesso_db OWNER appesso;
GRANT ALL PRIVILEGES ON DATABASE appesso_db TO appesso;
\q
EOF

echo -e "${GREEN}Database created successfully!${NC}"

echo -e "${YELLOW}Deployment script prepared. Now upload your project files to $PROJECT_DIR${NC}"