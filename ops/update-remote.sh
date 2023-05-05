cd ~/aimm &&
git checkout main &&
git fetch origin main &&
git reset --hard origin/main &&
cd web
sh ../ops/buildprod.sh
