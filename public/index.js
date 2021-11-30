const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io"); //甘い部分はありますが任意項目まで網羅出来てると思います
const io = new Server(server); //ログ保存先new_store.csv
const users = {}; //画像ファイル送信は画面右下のクリップマークです
let mlog = []; //#,@マーク検索はヘッダーのinput
let room = "general"; //スタンプはメッセージをmouseover
app.use(express.static('public'));
const fs = require('fs'); //---------チャンネル追加3パターン-------------
const csv = require('csv'); //【プライベートch】部屋作った人にだけボタンが追加される・部屋名を相手に教え相手もチャンネルを作ることで招待可能
let readline = require("readline"); //【公開チャンネル】全ユーザーに部屋ボタンが追加される
fs.writeFile('./new_store.csv', '', (err) => { //【DM】受信者と送信者にのみDMボタンが追加される

}); //下書きを押すとmodalが開きます
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');

});
io.on('connection', (socket) => {
    socket.join(room);
    socket.on('disconnect', () => {
        socket.broadcast.to(room).emit('chat message', `${socket.userName}が退室しました`);
        delete users[socket.id];
        io.emit("show_online", users);
    });

    socket.on('chat message', (msg) => {

        io.to(room).emit('chat message', msg + "【＠" + socket.userName + "】");
        makelog(msg);

    });


    socket.on("setUserName", (userName) => {
        socket.userName = userName;
        users[socket.id] = socket.userName;
        //console.log(users[socket.id])
        io.to(room).emit("chat message", `${socket.userName}が参加しました`);
        io.emit("show_online", users);
        // console.log(users);
        //socket.broadcast.emit("user list",socket.userName);
    });
    //room
    socket.on("setRoomName", (roomName, name2) => { //name2(部屋切り替えた人)
        socket.leave(room); //tuika
        room = roomName;
        socket.join(room);
        io.emit("show_online", users);
        io.to(room).emit('chat message', `${socket.userName}が#${room}に参加しました`);
        let stream = fs.createReadStream("./new_store.csv", "utf8");
        let reader = readline.createInterface({ input: stream });
        reader.on("line", (data) => {
            //if (data.indexOf(room)) {
            var array = data.split(',');
            // console.log(array[0]);//部屋名
            // console.log(array[1]);//name
            // console.log(array[2]);//メッセ―ジ
            if (array[0].indexOf(room) !== -1) {
                io.to(room).emit('restore message', array[2] + "【＠" + array[1] + "】", name2, array[3]); //切り替え先の部屋の過去チャット復元
                array = [];
            }
        });
    });


    //stamp
    socket.on("send stamp", (n) => {
        const s1 =
            "http://drive.google.com/uc?export=view&id=1aYcc8ZXq9ZGcHHjZpQr0I0nX2vpMc-mY";
        const s2 =
            "http://drive.google.com/uc?export=view&id=1G7i0TbY9BjW0JXLfbwXoJf-2QiA4tJeW";
        const s3 =
            "http://drive.google.com/uc?export=view&id=1H2mf9mBDI7DlI7T4KXhC2Hiw3x2ECXqT";
        const s4 =
            "http://drive.google.com/uc?export=view&id=1OybCs9_1VuuCH-0oji6zuEn2GMaiq6Ox";
        switch (n) {
            case 1:
                io.to(room).emit("image", s1);
                makelog("スタンプ【👍】");
                break;
            case 2:
                io.to(room).emit("image", s2);
                makelog("スタンプ【👎】");
                break;
            case 3:
                io.to(room).emit("image", s3);
                makelog("スタンプ【🖕】");
                break;
            case 4:
                io.to(room).emit("image", s4);
                makelog("スタンプ【👋】");
                break;
        }
    });
    socket.on('image', (imageData) => {
        //socket.broadcast.emit('image', imageData);
        io.to(room).emit('image', imageData);
        makelog("画像ファイル");
    });
    socket.on("DM", (receiver, sender) => {
        let DM = receiver + "&" + sender;
        io.emit('DM create', DM, receiver, sender);
    });

    // ?
    // socket.on("add channel", (ch) => {
    //     socket.broadcast.emit('ch create', ch);
    // });

    let nowTyping = 0;
    socket.on("start typing", () => {
        if (nowTyping <= 0) {
            socket.broadcast.to(room).emit("start typing", socket.userName);
        }
        nowTyping++;
        setTimeout(() => {
            nowTyping--;
            if (nowTyping <= 0) {
                socket.broadcast.to(room).emit("stop typing");
            }
        }, 3000);
    });
    //ログ保存
    function makelog(msg_stamp) {
        let now = new Date();
        mlog.push(msg_stamp)
        mlog.push(socket.userName)

        fs.createReadStream('./store.csv').pipe(csv.parse({ columns: true }, (err, data) => {
            let log = data;
            log.push({
                roomID: room,
                namelog: socket.userName,
                msg_stamp_log: msg_stamp,
                stimestamp: now.toLocaleString(),
            });
            //console.log(log);

            csv.stringify(log, (err, data) => {
                fs.appendFile('./new_store.csv', data, (err) => {
                    console.log(data);
                    console.log('logを保存しました');
                });
            });

        }));
    }
});
server.listen(3000, () => {
    console.log('listening on *:3000');
    console.log(`Example app listening at http://localhost:3000`);
});