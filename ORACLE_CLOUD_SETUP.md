# Deploy Identif.ai on Oracle Cloud Always Free

Complete step-by-step pipeline for free hosting on ARM with 6GB RAM.

---

## Phase 1: Oracle Cloud Setup (5-10 min)

### 1.1 Create Oracle Cloud Account
1. Go to https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Sign up with email (takes ~5 min)
4. Verify email
5. Choose region closest to you (e.g., Mumbai, Tokyo, Frankfurt)
6. Accept terms and create account

### 1.2 Launch Compute Instance
1. From Dashboard, click **Compute** → **Instances**
2. Click **Create Instance**
3. Configure:
   - **Name:** `identifai-prod`
   - **Image:** Ubuntu 22.04 (ARM/Ampere compatible)
   - **Shape:** Ampere (ARM) - free tier eligible, 4 OCPU, 24GB RAM
   - **Networking:** Create new VCN (auto-creates security rules)
   - **SSH Key:** Download and save `identifai-prod.key` locally
   - Click **Create**
4. Wait 2-3 minutes for instance to boot
5. Note the **Public IP Address** (e.g., 1.2.3.4)

### 1.3 Security Group Rules
1. From instance details, click **Subnets** → **Security List**
2. Click **Add Ingress Rules** and add:
   - **Port 80, Protocol TCP** (HTTP)
   - **Port 443, Protocol TCP** (HTTPS)
   - **Port 8000, Protocol TCP** (ML backend, optional for debugging)
3. Save

---

## Phase 2: Connect to Instance (2-5 min)

### 2.1 SSH into Oracle Cloud instance
```bash
# On your local machine
chmod 600 ~/Downloads/identifai-prod.key

# SSH in (replace 1.2.3.4 with your Public IP)
ssh -i ~/Downloads/identifai-prod.key ubuntu@1.2.3.4

# You should see: ubuntu@identifai-prod:~$
```

### 2.2 Update system
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git
```

---

## Phase 3: Install Docker & Compose (3-5 min)

### 3.1 Install Docker (ARM-compatible)
```bash
sudo apt-get install -y docker.io docker-compose

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu

# Exit and reconnect SSH for group to take effect
exit
```

Reconnect:
```bash
ssh -i ~/Downloads/identifai-prod.key ubuntu@1.2.3.4
```

### 3.2 Verify Docker
```bash
docker --version
# Output: Docker version 20.10.x, build ...

docker run hello-world
# Output: Hello from Docker!
```

---

## Phase 4: Clone and Deploy (5-10 min)

### 4.1 Clone your repo
```bash
cd /home/ubuntu
git clone https://github.com/blacroc10/identif.ai.git
cd identif.ai
```

### 4.2 Create .env file with secrets
```bash
cat > .env << 'EOF'
HF_TOKEN=your_hf_token_here
HF_REPO=rveeee/identif-ai-sd-1.5
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
FORCE_CPU=1
WHISPER_MODEL=base
CPU_THREADS=4
MAX_PROMPT_CHARS=900
EOF
```

### 4.3 Start Docker Compose
```bash
docker-compose up -d --build

# Monitor builds
docker-compose logs -f

# Wait for all 3 services to be healthy (~10 min):
# - ml-backend health check
# - api startup
# - client startup

# Check status
docker-compose ps
```

Expected output (all should show "Up"):
```
identifai-ml       Up (healthy)
identifai-api      Up
identifai-client   Up
```

---

## Phase 5: Install Nginx + HTTPS (5-10 min)

### 5.1 Install Nginx
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 5.2 Configure Nginx reverse proxy
```bash
# Backup original
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# Create new config
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
upstream ml_backend {
    server localhost:8000;
}

upstream api_backend {
    server localhost:5001;
}

upstream client_backend {
    server localhost:3001;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name _;

    # SSL will be added by certbot
    ssl_certificate /etc/letsencrypt/live/identif-ai.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/identif-ai.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Timeouts for ML (face generation can take time)
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;

    # Client (React app)
    location / {
        proxy_pass http://client_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ML backend (optional, for debugging)
    location /ml {
        proxy_pass http://ml_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 5.3 Test Nginx config
```bash
sudo nginx -t
# Output: nginx: configuration file test is successful
```

### 5.4 Start Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx  # Auto-start on reboot

# Verify
sudo systemctl status nginx
```

---

## Phase 6: HTTPS with Let's Encrypt (2-5 min)

### 6.1 Get free SSL certificate

**Option A: With a real domain (recommended)**
1. Point your domain DNS to the Oracle Cloud Public IP
2. Then run:
```bash
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Answer prompts, certbot auto-updates Nginx config
```

**Option B: Without a domain (self-signed, for testing)**
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/letsencrypt/live/identif-ai.example.com/privkey.pem \
  -out /etc/letsencrypt/live/identif-ai.example.com/fullchain.pem \
  -subj "/CN=identif-ai.oracle.local"

# Update Nginx paths to match
sudo sed -i 's|identif-ai.example.com|identif-ai.oracle.local|g' /etc/nginx/sites-available/default
```

### 6.2 Reload Nginx
```bash
sudo systemctl reload nginx
```

---

## Phase 7: Get a Free Domain (Optional but recommended, 2 min)

If you don't have a domain yet, use:

**Option A: DuckDNS** (easiest, free subdomain)
1. Go to https://www.duckdns.org
2. Sign in with email
3. Click **Add domain**
4. Create subdomain: `identif-ai` (now `identif-ai.duckdns.org`)
5. Set IP to your Oracle Cloud public IP (1.2.3.4)
6. Update the Nginx config to use this domain

**Option B: Freenom** (free .tk/.ml domain)
1. Go to https://www.freenom.com
2. Search for domain
3. Register for 12 months (free)
4. Point DNS to your Oracle IP
5. Takes ~1 hour to propagate

Then update Nginx:
```bash
sudo sed -i 's|server_name _;|server_name yourdomain.com www.yourdomain.com;|g' /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Phase 8: Test Everything (5-10 min)

### 8.1 Check services are running
```bash
docker-compose ps

# Should show all 3 up:
# identifai-ml       Up (healthy)
# identifai-api      Up
# identifai-client   Up
```

### 8.2 Test from your machine
```bash
# Replace with your IP or domain
curl https://1.2.3.4/api/health
# Output: {"status":"ok",...}

# Or open browser: https://1.2.3.4 (or https://yourdomain.com)
```

### 8.3 Test full pipeline from UI
1. Open browser to https://yourdomain.com (or IP)
2. Navigate to Narration section
3. Upload audio or text
4. Trigger face generation
5. Wait for ML backend response

---

## Maintenance & Auto-Restart

### 8.1 Auto-restart containers on reboot
```bash
docker-compose down
docker-compose up -d --build

# Verify they restart on boot:
sudo reboot

# After reboot, SSH back in and check:
docker-compose ps
```

### 8.2 View logs
```bash
# All services
docker-compose logs -f --tail 100

# Single service
docker-compose logs -f ml-backend
docker-compose logs -f api
docker-compose logs -f client
```

### 8.3 Redeploy (when code changes)
```bash
cd /home/ubuntu/identif.ai
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## Troubleshooting

### ML Service OOM (Out of Memory)
```bash
# Check memory usage
free -h

# If OOM, reduce Whisper model:
nano .env
# Change: WHISPER_MODEL=tiny  # instead of base

docker-compose restart ml-backend
```

### Port already in use
```bash
# Find what's using port 3001, 5001, or 8000
sudo lsof -i :3001

# Kill it
sudo kill -9 <PID>
```

### Nginx not routing correctly
```bash
# Check config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Domain DNS not updating
```bash
# Test DNS resolution
nslookup yourdomain.com

# If not propagated, wait 5-15 min and retry
# Use IP directly in the meantime: https://1.2.3.4
```

---

## Cost Verification

Oracle Cloud Always Free includes:
- ✅ 2 Ampere VMs (4 OCPU each = 8 total free)
- ✅ 24GB RAM total (12GB per instance possible)
- ✅ 200GB storage
- ✅ Data egress: 1TB/month free

**Your project:**
- 1 Ampere instance = well within free tier
- 6GB RAM usage < 24GB limit
- Docker compose auto-restarts on reboot

**Monthly cost: $0**

---

## Quick Reference: One-Liner to Check Everything

```bash
# SSH in, then run this
docker-compose ps && echo "---" && free -h && echo "---" && sudo systemctl status nginx
```

Done! Your app should now be live at `https://yourdomain.com` (or `https://your-oracle-ip`) and completely free forever.
