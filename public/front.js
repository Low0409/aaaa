$(function () {
    $("#select2").select2({
        width: "50%",
        placeholder: "#,@検索",
        background: "blue",
    });
});
$(function () {
    $(".js-modal-open").on("click", function () {
        $(".js-modal").fadeIn();
        return false;
    });
    $(".js-modal-close").on("click", function () {
        $(".js-modal").fadeOut();
        return false;
    });
});



function addprivateroom() {
    //【プライベートチャンネル】部屋作った人にだけ部屋ボタンが追加される・部屋名を相手に教えることで実質招待
    let textbox = document.getElementById("privateroomtext");
    let inputValue = textbox.value;
    textbox.value = "";
    $(".channel_list").prepend(
        `<button id="bt" >#${inputValue}</button><br>`
    );
    $("#bt").click(inputValue, function (e) {
        moveToRoom(inputValue);
    });
    $("#Channel").append(`<option>#${inputValue}</option>`);
}
//?

// function addroom() {
//     //【公開チャンネル】全ユーザーに部屋ボタンが追加される
//     let textbox = document.getElementById("roomtext");
//     let inputValue = textbox.value;
//     socket.emit("add channel", inputValue);
//     textbox.value = "";
//     $(".channel_list").prepend(
//         `<button id="bt" >#${inputValue}</button><br>`
//     );
//     $("#bt").click(inputValue, function (e) {
//         moveToRoom(inputValue);
//     });
//     $("#Channel").append(`<option>#${inputValue}</option>`);
// }

function addDMroom() {
    //【DM】受信者と送信者にのみDMボタンが追加される
    let receiver = document.getElementById("DMtext");
    let inputValue = receiver.value;
    socket.emit("DM", inputValue, name); //送信者と受信者
    $("#Channel").append(`<option>#${inputValue}</option>`);
    receiver.value = "";
}



const socket = io();

const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const toUser = document.querySelector("#input");
const typingAlert = document.querySelector(".typing_alert");

let channelBtn = document.getElementsByClassName('channel_list')[0];

let name = "";
let userarray = [];
let room_name = "general";
name = prompt("ユーザー名を入力してください");
$("#User").append($("<option>").html("@" + name));

let onlineUsers = [];

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit("chat message", input.value);
        input.value = "";
    }
});

socket.on("chat message", (msg) => {
    //appendMessage(msg);
});
socket.on("restore message", (message, name2, time) => {
    //部屋移動先メッセ復元
    if (name == name2) {
        // restoreMessage(message, time);
        //とりあえずコメントアウト
        
    }
    name2 = "";
});

socket.on("connect", () => {
    socket.emit("setUserName", name);

});

socket.on("show_online", (users) => {
    const onlineMembers = document.querySelector(".online_user");
    onlineMembers.innerHTML = "";
    onlineUsers = [];
    for (const id in users) {
        onlineMembers.innerHTML += `<li>👤${users[id]}</li>`;
        onlineUsers.push(users[id]);
    }
});

socket.on("image", (imageData) => {
    if (imageData) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var img = new Image();
        img.src = imageData;
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            //document.body.appendChild(canvas);

            $("li:last").append("<li>dummy</li>");
            $("li:last").html("<img src= " + imageData + ">");
        };
    }
});

//アップロードを許可する拡張子
//jpg jpeg png gif をimgタグで表示するため拡張子判定を行う
var allow_exts = new Array('jpg', 'jpeg', 'png','gif');

//アップロード予定のファイル名の拡張子が許可されているか確認する関数
function checkImgExt(fileName)
{
	//比較のため小文字にする
	var ext = getExt(fileName).toLowerCase();
	//許可する拡張子の一覧(allow_exts)から対象の拡張子があるか確認する
	if (allow_exts.indexOf(ext) === -1) return false;
	return true;
}

//ファイル名を渡して拡張子を返す
function getExt(fileName) {
    var pos = fileName.lastIndexOf('.');
    if (pos === -1) return '';
    return fileName.slice(pos + 1);
}

function sendImage(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = (event) => {
        socket.emit("image", event.target.result);
    };

    reader.readAsDataURL(file);
}

//appendMessage拡張版
//引数のデータタイプに応じた表示に切り替えてappendする
const appendContent = (sender_name,text,dataType,fileUrl,timestamp)=>{
    var time = timestamp.slice(5, -3);
    let n = 0;
    const item = document.createElement("li");
    const subText= document.createElement("div");
    item.className = "msglist";
    item.onmouseover = function () {
        if (n == 0) {
            item.innerHTML += `<button type="button" id="button_1" onclick="sendStamp(1)">👍</button>`;
            item.innerHTML += `<button type="button" id="button_2" onclick="sendStamp(2)">👎</button>`;
            item.innerHTML += `<button type="button" id="button_3" onclick="sendStamp(3)">🖕</button>`;
            item.innerHTML += `<button type="button" id="button_4" onclick="sendStamp(4)">👋</button>`;
        }
        n = 1;
    };

    switch (dataType) {
        case 'msg': //itemにmsg格納
            item.textContent = text + "【@" + sender_name + "】" + time;
            // console.log('msg');
            break;
    
        case 'img': //imgタグをつくって画像表示
            const imageData=document.createElement("img");
            imageData.classList.add('appendImg')
            imageData.src=fileUrl;
            // imageData.width=300;
            item.appendChild(imageData);
            // console.log('img');
            break;
        
        case 'link':
            const link=document.createElement('a');
            link.textContent=text;
            link.href=text;
            console.log(text)
            link.target="_blank";
            subText.textContent="【@" + sender_name + "】" + time;
            item.appendChild(link);
            item.appendChild(subText);
            console.log('link');
            break;
            

        case 'other':   //aタグでファイルリンク表示
            const urlLink= document.createElement("a");
            // const subText= document.createElement("div");
            urlLink.textContent=text;
            urlLink.href=fileUrl;
            urlLink.download="";
            urlLink.target="_blank";
            subText.textContent="【@" + sender_name + "】" + time;
            item.appendChild(urlLink);
            item.appendChild(subText);
            // console.log('other');
            break;
    }

    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

//チャンネルリストのボタン追加
const appendChList =(name)=>{

    const chBtn=document.createElement("button");
    const brTag=document.createElement("br");
    chBtn.textContent="# "+name;
    chBtn.setAttribute('onclick', "moveToRoom('"+name+"')");
    chBtn.id=name;
    channelBtn.appendChild(chBtn);
    channelBtn.appendChild(brTag);

};


//使ってない
const restoreMessage = (message, timestamp) => {
    //部屋移動したとき復元
    var time = timestamp.slice(5, -3);
    let n = 0;
    const item = document.createElement("li");
    item.className = "msglist";
    item.onmouseover = function () {
        if (n == 0) {
            item.innerHTML += `<button type="button" id="button_1" onclick="sendStamp(1)">👍</button>`;
            item.innerHTML += `<button type="button" id="button_2" onclick="sendStamp(2)">👎</button>`;
            item.innerHTML += `<button type="button" id="button_3" onclick="sendStamp(3)">🖕</button>`;
            item.innerHTML += `<button type="button" id="button_4" onclick="sendStamp(4)">👋</button>`;
        }
        n = 1;
    };
    item.textContent = message + time;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
};
//tuika

socket.on("start typing", (nowTypingUser) => {
    typingAlert.innerHTML += `${nowTypingUser}入力中`;
});

socket.on("stop typing", () => {
    typingAlert.innerHTML = "";
});

// socket.on("ch create", (ch) => {
//     $(".channel_list").prepend(`<button id="bt" >#${ch}</button><br>`);
//     $("#bt").click(ch, function (e) {
//         moveToRoom(ch);
//     });
// });

socket.on("DM create", (dm, receiver_1, sender_1) => {
    if (name == receiver_1 || name == sender_1) {
        $(".DM_list").prepend(`<button id="bt_dm" >📩${dm}</button><br>`);
        $("#bt_dm").click(dm, function (e) {
            moveToRoom(dm);
        });
    }
});
input.addEventListener("input", (e) => {
    socket.emit("start typing");
});

function moveToRoom(roomname) {
    //部屋移動
    room_name = roomname;
    x = 2000;
    //room_name_set(roomname);
    $("#center > h3").text("#" + roomname);
    $("li").remove(); //白紙に戻す
    socket.emit("setRoomName", roomname, name);
}

function sendStamp(n) {
    socket.emit("send stamp", n);
}

const file = document.getElementById("file");

// file.addEventListener("change", sendImage, false);

//日付表示
var today = new Date();
let x = 0;
var month = today.getMonth() + 1;
var week = today.getDay();
var day = today.getDate();

var week_ja = new Array("日", "月", "火", "水", "木", "金", "土");

let datetext = month + "月" + day + "日 " + "(" + week_ja[week] + ")";
$("#date").text(datetext);
//textareaコピーボタン
function cp() {
    let txt = document.getElementById("copy");
    txt.select();
    document.execCommand("Copy");
}