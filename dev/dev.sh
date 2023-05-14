nginx -p $(pwd) -c $(pwd)/dev/dev.nginx
cd client/web
npm start &
cd ../..
ts-node server/api.ts &
