echo "Deploying on remote machine..."
docker build --network="host" --no-cache -t apm-docker . &&
docker ps -aq | xargs docker stop | xargs docker rm;
docker run -d --network="host" --add-host=host.docker.internal:172.17.0.1 apm-docker;
wait 5;
curl localhost:3030/api/hello

