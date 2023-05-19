SERVER_AUTH="ubuntu@${SERVER}"
if [[ $1 == *"production"* ]]
then
  SERVER_AUTH=${AIMM_PROD_SERVER}
fi
if [[ $1 == *"stage"* ]]
then
  SERVER_AUTH=${AIMM_STAGE_SERVER}
fi

scp -P 22 ops/nginx/* ${SERVER_AUTH}:/tmp/;
if [[ $1 == *"stage"* ]]
then
  ssh -p 22 -t ${SERVER_AUTH} "sudo cp /tmp/*nginx* /etc/nginx/ && sudo cp /etc/nginx/routes.stage.nginx /etc/nginx/routes.nginx && sudo nginx -t && sudo nginx -s reload";
else
  ssh -p 22 -t ${SERVER_AUTH} "sudo cp /tmp/*nginx* /etc/nginx/ && sudo nginx -t && sudo nginx -s reload";
fi
