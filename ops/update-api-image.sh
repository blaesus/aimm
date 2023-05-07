echo "Deploying on remote machine..."

docker build --file api.dockerfile --network="host" --no-cache -t aimm-api . &&

docker run -d -p 4000:4000 --add-host=host.docker.internal:127.0.0.1 aimm-api;
