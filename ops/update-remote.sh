cd ~/aimm &&
git checkout main &&
git fetch origin main &&
git reset --hard origin/main &&

docker compose build
docker compose down
npx prisma migrate deploy
docker compose up -d
