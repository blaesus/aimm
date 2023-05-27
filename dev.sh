nodemon --watch "./**" --ext "ts" server/api.ts &
nodemon --watch "./**" --ext "ts" server/admin-api.ts &
npx http-server -p 8010 client/web &
sleep 3
./node_modules/.bin/webpack-dev-server --config client/web/webpack.config.js

killall node
