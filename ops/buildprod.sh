echo "Deploying on remote machine..."

docker build --network="host" --no-cache -t aimm-api . &&
docker build --network="host" --no-cache -t aimm-api . &&

docker run -d --network="host" --add-host=host.docker.internal:172.17.0.1 aimm-api;

