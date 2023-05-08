cd ~/aimm &&
git checkout main &&
git fetch origin main &&
git reset --hard origin/main &&

docker compose up -d --build --force-recreate --no-deps
