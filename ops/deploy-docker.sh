git checkout main &&
git push &&
ssh ubuntu@apm1 "cd ~/apm && git pull && sh buildprod.sh"

