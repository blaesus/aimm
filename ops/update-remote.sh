cd ~/aimm &&
git checkout main &&
git fetch origin main &&
git reset --hard origin/main &&
sh ops/buildprod.sh
