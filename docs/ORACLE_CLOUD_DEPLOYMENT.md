# 🏛️ Complete Oracle Cloud (OCI) Always-Free Deployment Guide

This guide details how to host your **PostgreSQL Database**, **ChromaDB Vector Store**, and **Node.js Backend** on a single **Oracle Cloud Always Free Ampere A1 VM (4 OCPUs, 24 GB RAM, 200 GB Storage)** for **$0 / ₹0 forever**.

---

## 📋 Architecture Overview

```
                           [ Users on Internet ]
                                     │
                             Port 80 / 443 (HTTPS)
                                     ▼
                ┌─────────────────────────────────────────┐
                │   Oracle Cloud VM (Ubuntu 24.04 ARM64)  │
                │        (4 OCPU, 24 GB RAM, 200 GB)      │
                │                                         │
                │        ┌───────────────────────┐        │
                │        │     Nginx Web Server  │        │
                │        │  (Reverse Proxy + SSL)│        │
                │        └───────────┬───────────┘        │
                │                    │                    │
                │                    ▼                    │
                │        ┌───────────────────────┐        │
                │        │   Node.js Backend     │        │
                │        │  (PM2 Cluster Mode)   │        │
                │        └───────┬───────┬───────┘        │
                │                │       │                │
                │    localhost   ▼       ▼  localhost     │
                │   ┌──────────────┐   ┌──────────────┐   │
                │   │  PostgreSQL  │   │   ChromaDB   │   │
                │   │  (Port 5432) │   │ (Port 8000)  │   │
                │   └──────────────┘   └──────────────┘   │
                └─────────────────────────────────────────┘
```

---

## Part 1: Create Your Free VM on Oracle Cloud

### 1.1 Sign Up
1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) and sign up.
2. Select your Home Region (e.g., **India West - Mumbai** or **India South - Hyderabad**).

### 1.2 Create the Ampere VM Instance
1. In the OCI Console, navigate to: **Compute** ➔ **Instances** ➔ **Create Instance**.
2. **Name**: `ssmm-qpgen-server`.
3. **Placement**: Keep default Availability Domain.
4. **Image and Shape**:
   - Click **Change Image**: Select **Ubuntu 24.04 LTS** (or 22.04 LTS).
   - Click **Change Shape**:
     - Choose **Ampere (Arm-based Processor)**.
     - Select **VM.Standard.A1.Flex**.
     - Set **OCPUs**: `4` (or `2` to `4`).
     - Set **Memory (RAM)**: `24 GB` (or `12` to `24 GB`).
     - *(Notice the badge: **"Always Free Eligible"**)*.
5. **Networking**: Keep defaults (Creates a new Virtual Cloud Network).
6. **Add SSH Keys**:
   - Choose **Generate a key pair for me**.
   - Click **Save Private Key** (downloads `ssh-key.key` to your computer). Keep this safe!
7. **Boot Volume**:
   - Check **Specify a custom boot volume size**: Enter `200` GB (Always Free allows up to 200 GB).
8. Click **Create**. In ~2 minutes, your VM state will become green (**Running**).
9. Copy your **Public IP Address** (e.g., `129.154.xx.xx`).

---

## Part 2: Open Firewall Ports in Oracle Cloud

Oracle Cloud blocks incoming web traffic by default. You must open Ports 80 and 443 in the **OCI Security List**.

### 2.1 In OCI Security List
1. On your instance page, click your **Subnet** link (under Primary VNIC).
2. Click the **Default Security List**.
3. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80,443`
   - **Description**: `Allow HTTP and HTTPS`
4. Click **Add Ingress Rules**.

---

## Part 3: Connect to Your Server via SSH

From PowerShell on your Windows PC:
```powershell
cd C:\Users\dipak\Downloads
ssh -i ssh-key.key ubuntu@<YOUR_ORACLE_PUBLIC_IP>
```

---

## Part 4: Configure Ubuntu Server & Open OS Firewall

Run these commands inside your SSH session:

```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Configure Ubuntu iptables to allow HTTP & HTTPS traffic
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Install essential build tools, Git, and Nginx
sudo apt install -y curl wget git build-essential nginx netfilter-persistent
```

---

## Part 5: Install & Set Up PostgreSQL (Database)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE school_db;
CREATE USER qpgen_user WITH ENCRYPTED PASSWORD 'YourStrongDbPassword123!';
GRANT ALL PRIVILEGES ON DATABASE school_db TO qpgen_user;
ALTER DATABASE school_db OWNER TO qpgen_user;
\c school_db
GRANT ALL ON SCHEMA public TO qpgen_user;
EOF
```

---

## Part 6: Install Docker & Run ChromaDB (Vector Store)

```bash
# Install Docker
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Create persistent storage folder for ChromaDB
sudo mkdir -p /var/chroma_data
sudo chmod -R 777 /var/chroma_data

# Run ChromaDB container (Always restarts automatically)
sudo docker run -d \
  --name chromadb \
  --restart always \
  -p 8000:8000 \
  -v /var/chroma_data:/chroma/chroma \
  -e IS_PERSISTENT=TRUE \
  -e ANONYMIZED_TELEMETRY=FALSE \
  chromadb/chroma:latest
```

---

## Part 7: Install Node.js 20 & Puppeteer Dependencies

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 Process Manager globally
sudo npm install -g pm2

# Install Chromium system dependencies for Puppeteer PDF printing
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libasound2t64 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2t64 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  chromium-browser
```

---

## Part 8: Clone Repo & Configure the Backend

```bash
# Clone the repository
git clone https://github.com/Majorprojectcodecrafters/Majorproject.git /var/www/majorproject

cd /var/www/majorproject/backend

# Install production dependencies
npm install --production

# Create production .env file
nano .env
```

Paste your production configuration:
```env
NODE_ENV="production"
PORT=5000
DATABASE_URL="postgresql://qpgen_user:YourStrongDbPassword123!@localhost:5432/school_db?schema=public"
JWT_SECRET="generate-a-random-secret-string-here-64-chars"

# LLM Providers
LLM_PROVIDER="groq"
GROQ_API_KEY="your-groq-key"
GROQ_MODEL="openai/gpt-oss-20b"
GEMINI_API_KEY="your-gemini-key"

# Vector Database (Local ChromaDB container)
CHROMA_HOST="localhost"
CHROMA_PORT=8000
CHROMA_SSL=false

# Google Drive Integration
GOOGLE_CLIENT_ID="545786000624-3v4l7spd730a5gsbhktve3d8g1d33p5o.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REFRESH_TOKEN="your-refresh-token"
GOOGLE_DRIVE_ROOT_FOLDER="1wxE6JxA2_6qXxo0tAforJrH-ZA13IVL8"

# School Branding
SCHOOL_NAME="Shree Siddheshwar Mahavidyalaya"
SCHOOL_ADDRESS="Majalgaon, Taluka: Majalgaon, District: Beed, Maharashtra-431131"
SCHOOL_PHONE="+91 2443 235475"
SCHOOL_EMAIL="ssmmajalgaon1@gmail.com"
SCHOOL_WEBSITE="ssmm.ac.in"

# CORS
CORS_ORIGIN="http://<YOUR_ORACLE_PUBLIC_IP>,https://<YOUR_DOMAIN>"
```

### Initialize Prisma Database
```bash
npx prisma generate
npx prisma db push
npm run seed
```

---

## Part 9: Start Backend with PM2 (Multi-Core Cluster)

```bash
# Start backend on all 4 CPU cores
pm2 start src/server.js -i max --name "qpgen-backend"

# Ensure PM2 starts automatically on server reboots
pm2 save
pm2 startup
```

---

## Part 10: Build & Serve Frontend with Nginx

```bash
cd /var/www/majorproject/frontend

echo 'VITE_API_BASE_URL="http://<YOUR_ORACLE_PUBLIC_IP>/api"' > .env.production
npm install
npm run build
```

Configure Nginx reverse proxy:
```bash
sudo nano /etc/nginx/sites-available/qpgen
```

```nginx
server {
    listen 80;
    server_name <YOUR_ORACLE_PUBLIC_IP> yourdomain.com;

    root /var/www/majorproject/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 180s;
        proxy_connect_timeout 180s;
        proxy_send_timeout 180s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/qpgen /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Part 11: Transferring Pre-Indexed Vectors from Windows PC

From PowerShell on your local Windows PC:
```powershell
# Copy local chroma_db folder to Oracle Cloud
scp -i C:\Users\dipak\Downloads\ssh-key.key -r C:\COLLEGE\Majorproject\backend\chroma_db ubuntu@<YOUR_ORACLE_PUBLIC_IP>:/tmp/

# Inside SSH on Oracle Cloud:
sudo cp -r /tmp/chroma_db/* /var/chroma_data/
sudo docker restart chromadb
```
