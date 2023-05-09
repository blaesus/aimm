cd ~/aimm &&
git fetch origin main &&
git checkout main &&
git reset --hard origin/main &&

docker compose build
docker compose down
npx prisma migrate deploy
docker compose up -d
