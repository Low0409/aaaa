// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getStorage, uploadBytes, ref as sRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-storage.js';
import {
    getDatabase,
    ref,
    push,
    set,
    onChildAdded,
    remove,
    onChildRemoved,
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
// Your web app's Firebase configuration


const firebaseConfig = {
    apiKey: "AIzaSyAPSukIMjPwJoZsL6k4qkP5UqkSnxqSzgk",
    authDomain: "sample-b2b18.firebaseapp.com",
    databaseURL: "https://sample-b2b18-default-rtdb.firebaseio.com",
    projectId: "sample-b2b18",
    storageBucket: "sample-b2b18.appspot.com",
    messagingSenderId: "998148803729",
    appId: "1:998148803729:web:27b6eae87dcc67d52d4330"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app); //RealtimeDBに接続
chListLoad();
contentAdd('general', 0); //初期設定 generalに入室

// Initialize firebase

let killNumber = 0;
// input要素
const fileInput = document.getElementById('file');
//チャンネル追加フォームのボタン
const addRoombutton = document.getElementById("addRoombutton");


//firebaseデータ登録

function dataSendToDB(txt, type, fName, url) {
    let now = new Date();
    let msg = {
        uname: name,
        text: txt,
        channel: room_name,
        dataType: type,
        fileName: fName,
        fileUrl: url,
        timestamp: now.toLocaleString() //現在時刻をタイムスタンプの値に設定
    };

    const newPostRef = push(ref(db, 'chat/' + room_name)); //ユニークKEYを生成
    set(newPostRef, msg); //"chat"にユニークKEYをつけてオブジェクトデータを登録
}

//メッセージ送信時発火
$("#send").on("click", function() {
    let inputVal = $("#input").val();
    console.log(inputVal.slice(0, 4) + 'slice')
    if (inputVal.slice(0, 4) == 'http') { //リンクを検出
        dataSendToDB(inputVal, 'link', 'null', 'null');
    } else {
        dataSendToDB(inputVal, 'msg', 'null', 'null');
    }
});


//ファイルのやりとり
//------------ファイル選択＆storageへアップロード------------------

//以下を行う
//1.ファイルをstorageへ送信
//2.storageに保存されたファイルのurlを取得
//3.取得したurlをRealtimeDatabaseに記録

const handleFileSelect = async() => {
        const files = fileInput.files;
        for (let i = 0; i < files.length; i++) {

            let file = files[i];
            let fileName = files[i].name;
            const storage = getStorage();
            const imageRef = sRef(storage, fileName);

            //1.ファイルをstorageへ送信
            await uploadBytes(imageRef, file).then((snapshot) => {
                console.log('Uploaded a blob or file!');
            });
            //2.storageに保存されたファイルのurlを取得
            let fileUrl = await fileUrlDownloader(fileName); //アップロード完了後にUrlを取りにいく

            //3.取得したurlをRealtimeDatabaseに記録
            if (checkImgExt(fileName)) {
                dataSendToDB(fileName, 'img', fileName, fileUrl);
            } else {
                dataSendToDB(fileName, 'other', fileName, fileUrl);
            };


        }

    }
    // ファイル選択時にhandleFileSelectを発火
fileInput.addEventListener('change', handleFileSelect);


//fileNameと同じ名前のファイルのリンクをfirebase storageから取得＋リンクをセットするメソッドを呼び出し
//getDownloadURLの呼び出し＋Urlを返す
const fileUrlDownloader = async(fileName) => {
    // console.log(fileName);
    const storage = getStorage();
    let getUrl; //戻り値格納用変数

    await getDownloadURL(sRef(storage, fileName)) //処理に時間がかかるのでawaitが必要
        .then((url) => {
            // `url` is the download URL for 'images/stars.jpg'

            // This can be downloaded directly:
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = (event) => {
                const blob = xhr.response;
            };
            xhr.open('GET', url);
            xhr.send();
            getUrl = url;

        })
        .catch((error) => {
            // Handle any errors
        });
    return getUrl;
}

//----------------------------------------------------------


//メッセージを追加
function contentAdd(channel, myNumber) {
    const dbRef = ref(db, 'chat/' + channel);

    onChildAdded(dbRef, function(data) {
        let log = data.val();
        if (killNumber == myNumber) { //最新のonChildAddedか照合
            appendContent(log.uname, log.text, log.dataType, log.fileUrl, log.timestamp); //チャット欄へデータの追加
        } else {
            return;
        }

    })
}


channelBtn.addEventListener('click', changeRoom); //部屋移動発火

function changeRoom(e) { //部屋移動
    console.log('roomChange');
    killNumber++;
    console.log(killNumber + ":killNumber");
    console.log(e.target.id);
    contentAdd(e.target.id, killNumber);

}

//チャンネル移動用のボタンのリストを作成
function chListLoad() {
    const chListRef=ref(db,'channelList');

    onChildAdded(chListRef, function(data) {
        let list = data.val();

        console.log(list.channelName);
        appendChList(list.channelName);

    })
}

//チャンネル追加フォームのイベントリスナー
addRoombutton.addEventListener('click',channelAdd);

let chSet = new Set(["general","random"]);

//チャンネル追加フォームの値をデータベースへ送信
function channelAdd() {
    
    //【公開チャンネル】全ユーザーに部屋ボタンが追加される
    let textbox = document.getElementById("roomtext");
    let inputValue = textbox.value;
    textbox.value = "";
    console.log(inputValue);
    
    //チャンネル名の重複防止
    if(!chSet.has(inputValue)){
        chSet.add(inputValue);
        let addCh={
            channelName:inputValue
        }
        
        const channelListRef = push(ref(db, 'channelList')); //ユニークKEYを生成
        set(channelListRef, addCh); //"channelList"にユニークKEYをつけてオブジェクトデータを登録
    }else{
        appendContent("error message","そのルームは既に存在します","msg","null","null");
    }

}

//ファイル送受信のプロセス
//---------------------
//1.ファイルをstorageへ送信
//2.storageに保存されたファイルのurlを取得
//3.取得したurlをRealtimeDatabaseに記録
//4.RDが各ユーザーに追加されたデータを送る  （onChildAdded）
//5.送信されたデータをメッセージ・画像・ファイルに応じた方法で表示 (appendMessage等)


//onChildAdded と チャンネル移動 について
//----------------------------------
//起動時に ①既存データを取得 ②データ更新されるたびに新データを取得し処理を行う
//①を利用してデータを取り込むことで部屋移動の際のデータ表示を行いたい
//しかし、部屋移動毎に②の部分が残り待機してしまう
//結果、複数回部屋移動を行なったのち新しく投稿を行うと、待機していた移動回数分のonChildAddedがその数だけappendContentを行い、投稿がダブる
//
//解決策として、
//静的な変数killNumberを用意する。
//killNumberの値は部屋移動毎に ＋１ される
//onChildAddedCollerが呼び出される際、killNumberを渡し、これをmyNumberとして保持させる
//appendContentが行われる際、myNumberとkillNumberの照合を行い、結果がfalseの場合appendContentは行わないようにする
//（最新のkillNumberを保持していないonChildAddedは処理を持たない状態になる）


//チャンネルリストの作成・更新
//---------------------
// window読み込み時にonChildAddedで'channelList'を参照
// 取得したデータをボタンにしてチャンネルリストに追加
// チャンネル追加フォームに入力された値を'channelList'に送信
// onChildAddedがリストの変更を検知し自動で更新
// 重複したチャンネル名が存在しないようにチャンネル追加の前にsetで検証