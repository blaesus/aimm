nodemon --watch "./**" --ext "ts" server/api.ts &
nodemon --watch "./**" --ext "ts" server/spider.ts &
sleep 5
cd client/web
npm start

killall node
