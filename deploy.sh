#!/usr/bin/env bash
# ==============================================================================
# Automated 1-Click AWS EC2 Deployment Script
# Project: Telegram Bot Store (sophasok.store)
# ==============================================================================

set -e

# Configuration
EC2_HOST="${EC2_HOST:-18.189.192.183}"
EC2_USER="${EC2_USER:-ubuntu}"
REMOTE_DIR="/var/www/TELEGRAM-BOT-STOR1"
DOMAIN="sophasok.store"

# Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}🚀  STARTING 1-CLICK DEPLOYMENT TO AWS EC2${NC}"
echo -e "${BLUE}    Target: ${EC2_USER}@${EC2_HOST} (${DOMAIN})${NC}"
echo -e "${BLUE}======================================================${NC}\n"

# 1. Locate SSH Key
KEY_CANDIDATES=(
  "${EC2_KEY}"
  "./Soha.pem"
  "${HOME}/.ssh/Soha.pem"
  "${HOME}/Downloads/Soha.pem"
)

SSH_KEY=""
for key in "${KEY_CANDIDATES[@]}"; do
  if [ -n "$key" ] && [ -f "$key" ]; then
    SSH_KEY="$key"
    break
  fi
done

if [ -z "$SSH_KEY" ]; then
  echo -e "${RED}❌ Error: SSH Key (Soha.pem) not found!${NC}"
  echo -e "${YELLOW}Please make sure Soha.pem is located in ~/Downloads or ~/.ssh or in this project directory.${NC}"
  echo -e "${YELLOW}Or export the path: export EC2_KEY=/path/to/Soha.pem${NC}"
  exit 1
fi

chmod 400 "$SSH_KEY" 2>/dev/null || true
echo -e "${GREEN}🔑 Found SSH Key:${NC} $SSH_KEY"

# 2. Check for local git changes & push
echo -e "\n${BLUE}📦 Checking Git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️ You have uncommitted local changes.${NC}"
  if [ -t 0 ]; then
    read -p "Do you want to commit and push all changes to GitHub now? [Y/n]: " -n 1 -r
    echo
  else
    REPLY="y"
  fi

  if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
    git add .
    COMMIT_MSG="Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}⬆️ Pushing changes to GitHub (origin main)...${NC}"
    git push origin main
  else
    echo -e "${YELLOW}Skipping commit. Deploying previously pushed commits...${NC}"
  fi
else
  # Check if local is ahead of origin
  git fetch origin main --quiet
  LOCAL_HASH=$(git rev-parse HEAD)
  REMOTE_HASH=$(git rev-parse origin/main)
  if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo -e "${GREEN}⬆️ Pushing local commits to GitHub...${NC}"
    git push origin main
  else
    echo -e "${GREEN}✅ Local git branch is clean and up to date.${NC}"
  fi
fi

# Optional: Sync .env file if --sync-env is passed
if [[ "$*" == *"--sync-env"* ]]; then
  echo -e "\n${YELLOW}🔐 Syncing backend/.env to EC2 server...${NC}"
  scp -o StrictHostKeyChecking=no -i "$SSH_KEY" backend/.env "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/backend/.env"
  echo -e "${GREEN}✅ backend/.env synced successfully!${NC}"
fi

# 3. Connect to EC2 and execute build & reload
echo -e "\n${BLUE}☁️  Connecting to AWS EC2 to update and build...${NC}"

ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "bash -s" << 'EOF'
set -e

REMOTE_DIR="/var/www/TELEGRAM-BOT-STOR1"
cd "$REMOTE_DIR"

echo "📥 1/5 Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main

echo "🐍 2/5 Updating Backend packages & database migrations..."
cd "$REMOTE_DIR/backend"
source .venv/bin/activate
pip install --quiet -r requirements.txt
alembic upgrade head
deactivate

echo "⚛️  3/5 Building Frontend (React Vite Store & Admin)..."
cd "$REMOTE_DIR/frontend"
npm install --prefer-offline --no-audit --loglevel=error
npm run build

echo "🔄 4/5 Restarting Telegram Bot & FastAPI backend service..."
sudo systemctl restart telegram-store

echo "🌐 5/5 Reloading Nginx server..."
sudo systemctl reload nginx

EOF

# 4. Verify deployment health
echo -e "\n${BLUE}🔍 Verifying deployment health...${NC}"
sleep 2

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "https://${DOMAIN}/" || echo "000")

if [ "$STATUS_CODE" = "200" ]; then
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}🎉 DEPLOYMENT SUCCEEDED! ALL SERVICES ARE LIVE!${NC}"
  echo -e "${GREEN}======================================================${NC}"
  echo -e "🌐 Website:  ${BLUE}https://${DOMAIN}${NC}"
  echo -e "🌐 WWW:      ${BLUE}https://www.${DOMAIN}${NC}"
  echo -e "📚 API Docs: ${BLUE}https://${DOMAIN}/docs${NC}"
  echo -e "🤖 Bot:      ${GREEN}Active & Running 24/7${NC}"
  echo -e "${GREEN}======================================================${NC}\n"
else
  echo -e "${YELLOW}⚠️ Deployment finished, but health check returned HTTP status: ${STATUS_CODE}${NC}"
  echo -e "Please check: https://${DOMAIN} or run 'ssh -i $SSH_KEY $EC2_USER@$EC2_HOST sudo journalctl -u telegram-store -n 30'"
fi
