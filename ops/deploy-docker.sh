git checkout main;
git push &&
ssh ubuntu@@62.210.95.35 "cd ~/aimm && git fetch main && git reset --hard origin/main && sh ops/buildprod.sh"

