killall node
nginx -s stop

nginx -p ${process.cwd()} -c ${process.cwd()}/dev/dev.nginx &
cd client/web
npm start &
ts-node server/api.ts &
