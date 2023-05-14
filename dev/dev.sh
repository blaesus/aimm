ROOT=$(pwd)

killall node

nginx -p $(pwd) -c $(pwd)/dev/dev.nginx

cd client/web
npm start &

cd $ROOT
ts-node server/api.ts &
