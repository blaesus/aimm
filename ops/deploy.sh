git checkout main;
git push &&
if [[ $1 == *"production"* ]]
then
  target=${AIMM_PROD_SERVER}
fi
if [[ $1 == *"stage"* ]]
then
  target=${AIMM_STAGE_SERVER}
fi
echo "target${target}"

ssh ${target} 'bash -s' < ops/update-remote.sh

