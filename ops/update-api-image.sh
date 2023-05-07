echo "Deploying on remote machine..."

docker build --file api.dockerfile --network="host" --no-cache -t aimm-api . &&
docker stop aimm-api-container;
sleep 5;
docker rm -f aimm-api-container &&
docker run -d -p 4000:4000 --add-host=host.docker.internal:127.0.0.1 --name aimm-api-container aimm-api;
