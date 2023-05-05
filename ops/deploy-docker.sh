git checkout main;
git push &&
ssh ubuntu@apm1 "cd ~/aimm && git fetch main && git reset --hard origin/main && sh ops/buildprod.sh"

