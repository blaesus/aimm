echo "Deploying on remote machine..."

# Dockerfile can't copy from parent, we do it for it
cd web;
cp ../package*.json ./;
mkdir data
cp ../data/schema.prisma ./data/schema.prisma

docker build --network="host" --no-cache -t aimm-docker . &&
docker ps -aq | xargs docker stop | xargs docker rm;
docker run -d --network="host" --add-host=host.docker.internal:172.17.0.1 aimm-docker;
sleep 5;
curl localhost:3030/api/hello

