nodemon --watch "./**" --ext "ts" server/api.ts &
nodemon --watch "./**" --ext "ts" server/admin.ts &
sleep 3
./node_modules/.bin/webpack-dev-server --config client/web/webpack.config.js

killall node
