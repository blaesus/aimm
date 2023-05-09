git checkout main;
git push &&
ssh ${AIMM_SERVER} 'bash -s' < ops/update-remote.sh

