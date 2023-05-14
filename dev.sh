nodemon server/api.ts &;
nodemon server/spider.ts &;
sleep 5;
cd client/web
npm start

killall node
