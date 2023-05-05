echo "Deploying on remote machine..."
cp ../package*.json . # Dockerfile can't copy from parent
docker build --network="host" --no-cache -t aimm-docker . &&
docker ps -aq | xargs docker stop | xargs docker rm;
docker run -d --network="host" --add-host=host.docker.internal:172.17.0.1 aimm-docker;
wait 5;
curl localhost:3030/api/hello

