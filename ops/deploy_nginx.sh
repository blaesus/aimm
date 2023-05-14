SERVER="62.210.95.35"
SERVER_AUTH="ubuntu@${SERVER}"

scp -P 22 ops/nginx/* ${SERVER_AUTH}:/tmp/;
ssh -p 22 -t ${SERVER_AUTH} "sudo cp /tmp/*nginx* /etc/nginx/ && sudo nginx -t && sudo nginx -s reload";
