cd ~/aimm &&
git checkout main &&
git fetch origin main &&
git reset --hard origin/main &&

docker compose down
npx prisma migrate deploy
docker compose up -d --build --force-recreate --no-deps
