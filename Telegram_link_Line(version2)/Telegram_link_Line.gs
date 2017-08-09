function base() {
  //前期準備，不懂看README
  var sheet_key = ""; //你的sheet ID
  var doc_key = ""; //你的doc ID
  var Telegram_bot_key = ""; //Telegram bot的token
  var Telegram_id = ""; //你的Telegram帳號ID(要通知你)
  var Line_id = ""; //你的line ID
  var CHANNEL_ACCESS_TOKEN = ''; //你的Line token
  var email = "@gmail.com"; //你的email
  var FolderId = ""; //google_grive_FolderId
  //前期準備完成!==============================================================
  var base_json = {
    "sheet_key": sheet_key,
    "doc_key": doc_key,
    "Telegram_bot_key": Telegram_bot_key,
    "Telegram_id": Telegram_id,
    "Line_id": Line_id,
    "CHANNEL_ACCESS_TOKEN": CHANNEL_ACCESS_TOKEN,
    "email": email,
    "FolderId": FolderId
  }
  return base_json
}
//============================================================================
function doPost(e) {
  var base_json = base();
  var debug = 0; // 0=沒有要debug、1=模擬Telegram、2=模擬Line
  //模擬Telegram的話記得把要模擬的東西複製到分頁debug中的B1
  //模擬Line的話記得把要模擬的東西複製到分頁debug中的B2

  if (debug == 1) { //模擬Telegram
    var sheet_key = base_json.sheet_key
    var SpreadSheet = SpreadsheetApp.openById(sheet_key);
    var SheetD = SpreadSheet.getSheetByName("Debug");
    var e = SheetD.getRange(1, 2).getDisplayValue(); //讀取debug分頁中的模擬資訊
    var estringa = JSON.parse(e);
  } else if (debug == 2) { //模擬Line
    var sheet_key = base_json.sheet_key
    var SpreadSheet = SpreadsheetApp.openById(sheet_key);
    var SheetD = SpreadSheet.getSheetByName("Debug");
    var e = SheetD.getRange(2, 2).getDisplayValue(); //讀取debug分頁中的模擬資訊
    var estringa = JSON.parse(e);
  } else {
    var estringa = JSON.parse(e.postData.contents);
    var ee = JSON.stringify(estringa);
  }

  var text = "";
  var sheet_key = base_json.sheet_key
  var doc_key = base_json.doc_key
  var email = base_json.email
  var Telegram_bot_key = base_json.Telegram_bot_key
  var Telegram_id = base_json.Telegram_id
  var Line_id = base_json.Line_id
  var CHANNEL_ACCESS_TOKEN = base_json.CHANNEL_ACCESS_TOKEN;

  /*/ debug用
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var SheetD = SpreadSheet.getSheetByName("Debug");
  var LastRowD = SheetD.getLastRow();
  //SheetD.getRange(LastRowD + 1, 2).setValue("ggggggggggg LastRowD= " + );
  //Logger.log("這裡被執行了! ");
  //*/

  //資料崩潰檢查修復=============================================================
  var doc = DocumentApp.openById(doc_key)
  var f = doc.getText()
  try {
    var ALL = JSON.parse(f);
  } catch (d) {
    var Dlen = f.search('}{"');
    var ff = f.substring(0, Dlen + 1)
    var r = ff;
    doc.setText(r); //寫入
  }
  //以下正式開始================================================================
  if (estringa.update_id) { //利用兩方json不同來判別
    //以下來自telegram
    var from = 'telegram';
    Log(estringa, from, sheet_key, email); //log
    var doc = DocumentApp.openById(doc_key)
    var f = doc.getText();
    var ALL = JSON.parse(f); //獲取資料//轉成JSON物件
    var mode = ALL.mode;
    var Stext = estringa.message.text; //前期準備完成

    //所有人檢查==================================================================
    if (Telegram_id != estringa.message.chat.id) { //如果不是 發一段話即結束
      var text = "您好!這是私人用的bot，不對他人開放\
      \n若您想要一個自己的 Telegram_link_Line 機器人，請至 \n" +
        "https://github.com/we684123/Telegram_link_Line "
      var payload = {
        "method": "sendMessage",
        'chat_id': estringa.message.from.id,
        'text': text
      }
      var data = {
        "method": "post",
        "payload": payload
      }
      UrlFetchApp.fetch("https://api.telegram.org/bot" + Telegram_bot_key + "/", data);
      return 0;
    }
    if (estringa.message.text) { //如果是文字訊息
      if (mode == "🚀 發送訊息" && Stext != "/exit") {
        //以下準備接收telegram資訊並發到line
        text = Stext;
        var Line_id = ALL.opposite.RoomId;
        var url = 'https://api.line.me/v2/bot/message/push';
        //--------------------------------------------------
        var retMsg = [{
          'type': 'text',
          'text': text
        }];
        var header = {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
        }
        var payload = {
          'to': Line_id,
          'messages': retMsg
        }
        var options = {
          'headers': header,
          'method': 'post',
          'payload': JSON.stringify(payload)
        }
        //--------------------------------------------------
        UrlFetchApp.fetch(url, options);
        ALL.mode = 0;
        text = "已傳送至 " + date.opposite.Name;
        var notification = true
        sendtext(text, notification);
        //================================================================
      } else if (mode == "🔖 重新命名") {
        if (ALL.FastMatch[Stext] != undefined) {
          text = "名子不可重複，請重新輸入一個!";
          var notification = true
          sendtext(text, notification);
        } else if (In(Stext)) {
          text = "名子不可跟命令重複，請重新輸入一個!";
          var notification = true
          sendtext(text, notification);
        } else {
          var OName = ALL.opposite.Name
          var FM = ALL.FastMatch[OName]
          ALL.data[FM].Name = Stext + "✅"
          var y = JSON.parse((String(JSON.stringify(ALL.FastMatch)).replace(OName, Stext)).replace(Stext, Stext + "✅"));
          //var yy = JSON.parse(String(JSON.stringify(ALL.FastMatch)).replace(Stext, Stext + "✅"));
          ALL.FastMatch = y;

          ALL.mode = 0
          var r = JSON.stringify(ALL);
          doc.setText(r); //寫入

          //以下處理RoomKeyboard==================================================
          REST_keyboard(doc_key) //重新編排keyborad
          //=====================================================================
          var text = "🔖 重新命名完成~\n" + OName + " \n->\n " + Stext + "\n🔮 開啟主選單"
          keyboard_main(text, doc_key)
        }
        //================================================================
      } else if (mode == "🔥 刪除聊天室" & Stext == "/delete") {
        REST_FastMatch1and2();
        var aims = ALL.opposite.RoomId
        var number = ALL.FastMatch2[aims]

        //doc處理
        ALL.data.splice(number, 1) //刪除目標
        ALL.mode = 0
        var r = JSON.stringify(ALL);
        doc.setText(r); //重新寫入

        //sheet處理
        var SpreadSheet = SpreadsheetApp.openById(sheet_key);
        var Sheet = SpreadSheet.getSheetByName("Line訊息區");
        Sheet.deleteColumn(number + 1);

        REST_keyboard(); //重製快速鍵盤
        REST_FastMatch1and2(); //重製快速索引

        text = "已刪除此聊天室";
        keyboard_main(text, doc_key)
        return 0;
      } else {
        //以下指令分流
        switch (Stext) {
          case '/main':
          case '🔃  重新整理':
            var text = "🔮 開啟主選單"
            keyboard_main(text, doc_key)
            break;
          case '🔙 返回房間':
            var keyboard = ALL.RoomKeyboard;
            var resize_keyboard = true
            var one_time_keyboard = false
            var text = "請選擇聊天室"
            ReplyKeyboardMakeup(keyboard, resize_keyboard, one_time_keyboard, text)

            break;
          case '🔭 訊息狀態':
            data_len = ALL.data.length;
            text = ""
            for (var i = 0; i < data_len; i++) {
              if (ALL.data[i].Amount == 0)
                continue;
              text = text + ALL.data[i].Name + '\n' + '未讀：' + ALL.data[i].Amount + '\n' + '-------------\n'
            }

            if (text == "") {
              text = "沒有任何未讀。"
            }
            var notification = true
            sendtext(text, notification);
            break;
          case '✔ 關閉鍵盤':
            var text = "已關閉鍵盤，如欲再次開啟請按 /main"
            ReplyKeyboardRemove(text)
            break;
          case '🚀 發送訊息':
            ALL.mode = "🚀 發送訊息"
            var r = JSON.stringify(ALL);
            doc.setText(r); //寫入
            text = "將對 " + ALL.opposite.Name + "發送訊息\n" + "如欲離開請輸入 /exit \n請輸入訊息："
            ReplyKeyboardRemove(text)
            break;
          case '/exit':
            ALL.mode = 0
            var r = JSON.stringify(ALL);
            doc.setText(r); //寫入
            text = "======已停止對話!======"
            keyboard_main(text, doc_key)
            break;
          case '📬 讀取留言':
            if (ALL.data[ALL.FastMatch2[ALL.opposite.RoomId]].Amount == 0) {
              text = "這個房間並沒有未讀的通知喔~ ";
              var notification = true
              sendtext(text, notification);
            } else {

              var SpreadSheet = SpreadsheetApp.openById(sheet_key);
              var SheetM = SpreadSheet.getSheetByName("Line訊息區");
              var col = ALL.FastMatch2[ALL.opposite.RoomId] + 1;

              var Amount = SheetM.getRange(1, col).getDisplayValue();
              Amount = JSON.parse(Amount)
              var st = Amount[1] + 2
              var ed = Amount[0] + 1
              for (var i = st; i <= ed; i++) {
                text = SheetM.getRange(i, col).getDisplayValue()
                var message = JSON.parse(text);
                Logger.log("message = ",message)
                Logger.log("message[0] = ",message[0])

                function upMessageData() {
                SheetM.getRange(i, col).setValue("")
                var t = "[" + (ed - 1) + "," + (i - 1) + "]"
                SheetM.getRange(1, col).setValue(t);
                SheetM.getRange(1, col).setValue(Amount);
              }

                if (message[0] == "文字") {
                  var p = message[1] + "：\n" + message[2]
                  Logger.log("ppp = ",p)
                  var notification = true
                  sendtext(p, notification);
                  //["文字","永格天@XXX","text"]
                  upMessageData()
                } else if (message[0] == "照片") {
                  //var url = message[0]
                  var notification = true
                  sendtext(p, notification);
                  //sendPhoto(url, notification)
                  //["照片",64918660963]
                  upMessageData()
                } else if (message[0] == "貼圖") {
                  var notification = true
                  sendtext(text, notification);
                  //["貼圖",64918733069,[502,2]]
                  upMessageData()
                } else if (message[0] == "錄音") {
                  var notification = true
                  sendtext(p, notification);
                  //sendAudio(url, notification)
                  //["錄音",6491886417992]
                  upMessageData()
                } else if (message[0] == "位置") {
                  var notification = true
                  var latitude = message[2]
                  var longitude = message[3]
                  sendLocation(latitude, longitude, notification)
                  //["位置",6491889182736,506台灣彰化縣福興鄉彰45-1鄉道24號
                  //,24.037687,120.47961]
                  upMessageData()
                } else if (message[0] == "影片") {
                  var notification = true
                  sendtext(text, notification);
                  //sendVoice(url)
                  //["影片",6491895815611]
                  upMessageData()
                } else if (message[0] == "檔案") {
                  var notification = true
                  sendtext(text, notification);
                  //senddocument(url)
                  upMessageData()
                }
              }



              ALL.data[ALL.FastMatch2[ALL.opposite.RoomId]].Amount = 0;
              var r = JSON.stringify(ALL);
              doc.setText(r); //寫入
              SheetM.getRange(1, col).setValue("[0,0]")

              text = "=======讀取完畢======="
              var notification = true
              sendtext(text, notification);
            }
            break;
            /*case '📬 讀取留言':    //備份個(能用的版本!)
              if (ALL.data[ALL.FastMatch2[ALL.opposite.RoomId]].Amount == 0) {
                text = "這個房間並沒有未讀的通知喔~ ";
                var notification = true
                sendtext(text, notification);
              } else {
                var SpreadSheet = SpreadsheetApp.openById(sheet_key);
                var SheetM = SpreadSheet.getSheetByName("Line訊息區");
                var col = ALL.FastMatch2[ALL.opposite.RoomId] + 1;

                var Amount = SheetM.getRange(1, col).getDisplayValue();
                var Amount2 = JSON.parse(Amount)
                var st = Amount2[1] + 2
                var ed = Amount2[0] + 1
                for (var i = st; i <= ed; i++) {
                  text = SheetM.getRange(i, col).getDisplayValue()
                  var notification = true
                  sendtext(text, notification);
                  SheetM.getRange(i, col).setValue("")
                  Amount2[1] = parseInt(i)-2;
                  //Amount2 = JSON.stringify(Amount2);
                  var t = "[" + (ed-1) + "," + (i-1) + "]"
                  SheetM.getRange(1, col).setValue(t);
                  var LastRowD = SheetD.getLastRow();
                  SheetD.getRange(LastRowD + 1, 2).setValue(Amount2)
                  SheetD.getRange(LastRowD + 1, 3).setValue(Amount2[0])
                  SheetD.getRange(LastRowD + 1, 4).setValue(Amount2[1])
                  SheetD.getRange(LastRowD + 1, 5).setValue(i)
                  SheetD.getRange(LastRowD + 1, 6).setValue(ed)
                  SheetD.getRange(LastRowD + 1, 7).setValue(t)
                }
                ALL.data[ALL.FastMatch2[ALL.opposite.RoomId]].Amount = 0;
                var r = JSON.stringify(ALL);
                doc.setText(r); //寫入
                SheetM.getRange(1, col).setValue("[0,0]")

                text = "=======讀取完畢======="
                var notification = true
                sendtext(text, notification);
              }
              break;
              */
          case '🔖 重新命名':
            ALL.mode = "🔖 重新命名"
            var r = JSON.stringify(ALL);
            doc.setText(r); //寫入
            text = "將對 " + ALL.opposite.Name + " 重新命名!!!\n" + "請輸入新名子："
            ReplyKeyboardRemove(text)
            break;
          case '🔥 刪除聊天室':
            ALL.mode = "🔥 刪除聊天室"
            var r = JSON.stringify(ALL);
            doc.setText(r); //寫入
            text = "你確定要刪除 " + ALL.opposite.Name + " 嗎?\n" + "若是請按一下 /delete\n" +
              "若沒按下則不會刪除!!!"
            var notification = false
            sendtext(text, notification);
            break;
          case '🐳 開啟通知':
            var OName = ALL.opposite.Name
            var FM = ALL.FastMatch[OName]
            ALL.data[FM].Notice = true;
            var u = ALL.data[FM].Name.replace("❎", "✅");
            ALL.data[FM].Name = u;
            var y = JSON.parse(String(JSON.stringify(ALL.FastMatch)).replace(OName, OName.slice(0, OName.length - 1) + "✅"));
            ALL.FastMatch = y;
            ALL.opposite.Name = u;
            var r = JSON.stringify(ALL);
            doc.setText(r); //寫入
            text = "已開啟 " + OName + " 的通知"
            var notification = false
            sendtext(text, notification);
            //以下處理RoomKeyboard==================================================
            REST_keyboard(doc_key) //重新編排keyborad
            break;
          case '🔰 暫停通知':
            var OName = ALL.opposite.Name
            var FM = ALL.FastMatch[OName]
            ALL.data[FM].Notice = false
            var u = ALL.data[FM].Name.replace("✅", "❎");
            ALL.data[FM].Name = u;
            var y = JSON.parse(String(JSON.stringify(ALL.FastMatch)).replace(OName, OName.slice(0, OName.length - 1) + "❎"));
            ALL.FastMatch = y;
            ALL.opposite.Name = u;
            var r = JSON.stringify(ALL);
            doc.setText(r); //寫入
            text = "已暫停 " + OName + " 的通知"
            var notification = false
            sendtext(text, notification);
            //以下處理RoomKeyboard==================================================
            REST_keyboard(doc_key) //重新編排keyborad
            break;
          case '/debug':
            REST_FastMatch1and2();
            REST_keyboard();
            text = "已debug"
            var notification = false
            sendtext(text, notification);
            break;
          case '/AllRead':
          case '/allread':
            AllRead();
            text = "已全已讀"
            var notification = true
            sendtext(text, notification);
            break;
          default:
            if (ALL.FastMatch[Stext] != undefined) {
              var FM = ALL.FastMatch[Stext]
              var OAmount = ALL.data[FM].Amount
              var OName = ALL.data[FM].Name
              var ORoomId = ALL.data[FM].RoomId
              ALL.opposite.RoomId = ORoomId;
              ALL.opposite.Name = OName;
              var r = JSON.stringify(ALL);
              doc.setText(r); //寫入
              var Notice = ALL.data[FM].Notice

              text = "您選擇了 " + OName + " 聊天室\n" + "未讀數量：" + OAmount + "\n聊天室通知：" + Notice + "\n請問你要?"
              keyboard = [
                [{
                  'text': '🚀 發送訊息'
                }, {
                  'text': '📬 讀取留言'
                }, {
                  'text': '🔖 重新命名'
                }],
                [{
                  'text': '🐳 開啟通知'
                }, {
                  'text': '🔰 暫停通知'
                }],
                [{
                  'text': "🔥 刪除聊天室"
                }, {
                  'text': "🔙 返回房間"
                }]
              ]
              var resize_keyboard = false
              var one_time_keyboard = false
              ReplyKeyboardMakeup(keyboard, resize_keyboard, one_time_keyboard, text)
            } else if (Stext.substr(0, 2) == "/d") {
              var s_len = Stext.length - 1;
              var number = Stext.substr(2, s_len)

              var FM = number;
              var OAmount = ALL.data[FM].Amount
              var OName = ALL.data[FM].Name
              var ORoomId = ALL.data[FM].RoomId
              ALL.opposite.RoomId = ORoomId;
              ALL.opposite.Name = OName;
              var r = JSON.stringify(ALL);
              doc.setText(r); //寫入
              var Notice = ALL.data[FM].Notice

              text = "您選擇了 " + OName + " 聊天室\n" + "未讀數量：" + OAmount + "\n聊天室通知：" + Notice + "\n請問你要?"
              keyboard = [
                [{
                  'text': '🚀 發送訊息'
                }, {
                  'text': '📬 讀取留言'
                }, {
                  'text': '🔖 重新命名'
                }],
                [{
                  'text': '🐳 開啟通知'
                }, {
                  'text': '🔰 暫停通知'
                }],
                [{
                  'text': "🔥 刪除聊天室"
                }, {
                  'text': "🔙 返回房間"
                }]
              ]
              var resize_keyboard = false
              var one_time_keyboard = false
              ReplyKeyboardMakeup(keyboard, resize_keyboard, one_time_keyboard, text)
            } else {
              text = "錯誤的操作喔（ ・∀・），請檢查環境是否錯誤"
              var notification = false
              sendtext(text, notification);
            }
        }
      }
    } else if (estringa.message.photo) { //如果是照片
      if (mode == "🚀 發送訊息") {
        //以下選擇telegram照片並發到line
        var p = estringa.message.photo
        var max = p.length - 1;

        var photo_id = p[max].file_id
        var Line_id = ALL.opposite.RoomId;
        TG_Send_Photo_To_Line(Line_id, photo_id)
        text = "(圖片已發送!)"
        var notification = false
        sendtext(text, notification);
      } else {
        text = "錯誤的操作喔（ ・∀・），請檢查環境是否錯誤"
        var notification = false
        sendtext(text, notification);
      }
    }

    //=====================================================================================================
  } else if (estringa.events[0].timestamp) {
    //以下來自line
    var from = 'line';
    Log(estringa, from, sheet_key, email); //log

    if (estringa.events[0].source.type == "user") {
      var Room_text = estringa.events[0].source.userId; //Room_text = 要發送的地址
      var userId = estringa.events[0].source.userId
    } else if (estringa.events[0].source.type == "room") {
      var Room_text = estringa.events[0].source.roomId;
      if (estringa.events[0].source.userId) {
        var userId = estringa.events[0].source.userId
      }
    } else {
      var Room_text = estringa.events[0].source.groupId;
      if (estringa.events[0].source.userId) {
        var userId = estringa.events[0].source.userId
      }
    } //強制轉ID

    if (estringa.events[0].source.userId) {
      var u = estringa.events[0].source.userId
      if (estringa.events[0].source.groupId) { //看是group or room 再取出對應數值
        var g = estringa.events[0].source.groupId
      } else {
        var g = estringa.events[0].source.roomId
      }
      if (estringa.events[0].source.type == "user") {
        var userName = getUserName(u); //如果有則用
      } else {
        var userName = newGetUserName(u, g);
      }
    }

    if (estringa.events[0].message.text) {
      if (userName) {
        text = '[\"文字\",\"' + userName + '\",\"' + String(estringa.events[0].message.text) + '\"]'; //取得訊息
      } else {
        text = '[\"文字\",\"' + String(estringa.events[0].message.text) + '\"]'; //取得訊息
      }
    } else if (estringa.events[0].message.type == "image") {
      if (userName) {
        text = String("[\"照片\"," + userName + estringa.events[0].message.id + "]") //取得照片
      } else {
        text = String("[\"照片\"," + estringa.events[0].message.id + "]") //取得照片
      }
    } else if (estringa.events[0].message.type == "sticker") {
      var id = estringa.events[0].message.id
      var stickerId = estringa.events[0].message.stickerId
      var packageId = estringa.events[0].message.packageId
      if (userName) {
        text = "[\"貼圖\"," + userName + id + "," + "[" + stickerId + "," + packageId + "]]"; //取得貼圖
      } else {
        text = "[\"貼圖\"," + id + "," + "[" + stickerId + "," + packageId + "]]"; //取得貼圖
      }
    } else if (estringa.events[0].message.type == "audio") {
      if (userName) {
        text = String("[\"錄音\"," + userName + estringa.events[0].message.id + "]") //取得錄音
      } else {
        text = String("[\"錄音\"," + estringa.events[0].message.id + "]") //取得錄音
      }
    } else if (estringa.events[0].message.type == "location") {
      var id = estringa.events[0].message.id
      var address = estringa.events[0].message.address
      var latitude = estringa.events[0].message.latitude
      var longitude = estringa.events[0].message.longitude
      if (userName) {
        text = '[\"位置\",' + userName + id + ',' + address + "," + latitude + "," + longitude + "]"; //取得位置
      } else {
        text = '[\"位置\",' + id + ',' + address + "," + latitude + "," + longitude + "]"; //取得位置
      }
    } else if (estringa.events[0].message.type == "video") {
      if (userName) {
        text = String("[\"影片\"," + userName + estringa.events[0].message.id + "]") //取得影片
      } else {
        text = String("[\"影片\"," + estringa.events[0].message.id + "]") //取得影片
      }
    } else if (estringa.events[0].message.type == "file") {
      if (userName) {
        text = String("[\"檔案\"," + userName + estringa.events[0].message.id + "]") //取得檔案
      } else {
        text = String("[\"檔案\"," + estringa.events[0].message.id + "]") //取得檔案
      }
    }

    var SpreadSheet = SpreadsheetApp.openById(sheet_key);
    var SheetM = SpreadSheet.getSheetByName("Line訊息區");

    var doc = DocumentApp.openById(doc_key)
    var f = doc.getText();
    var ALL = JSON.parse(f);
    //================================================================
    if (ALL.FastMatch2[Room_text] != undefined) { //以下處理已登記的
      if (ALL.mode == "🚀 發送訊息" && Room_text == ALL.opposite.RoomId) {
        text = text; //雖然沒意義但還是寫一下
        var notification = false
        sendtext(text, notification);
      } else {
        //以下處理sheet========================================================
        var col = ALL.FastMatch2[Room_text] + 1; //找欄位
        var LastRowM = SheetM.getRange(1, col).getDisplayValue();
        LastRowM = JSON.parse(LastRowM)
        SheetM.getRange(LastRowM[0] + 2, col).setValue(String(text)) //更新內容
        LastRowM[0] = LastRowM[0] + 1;
        SheetM.getRange(1, col).setValue(JSON.stringify(LastRowM)) //更新數量
        //以下處理doc==========================================================
        ALL.data[col - 1].Amount = ALL.data[col - 1].Amount + 1 //!!!!!!!!!!!!!!!!!!!!!!
        var r = JSON.stringify(ALL);
        doc.setText(r); //寫入
        //以下處理通知=========================================================
        var Notice = ALL.data[col - 1].Notice //通知 true or false
        if (Notice) {
          text = "你有新訊息!\n來自：" + ALL.data[col - 1].Name + "\n點擊以快速切換至該房間 /d" + (col - 1);
          var notification = false
          sendtext(text, notification);
        }
      }

    } else { //以下處理未登記的(新資料)=======================
      var newcol = Object.keys(ALL.FastMatch2).length;
      //以下處理FastMatch2==================================
      var R = ',"' + Room_text + '":' + newcol + "}"
      var y1 = JSON.stringify(ALL.FastMatch2)
      var y2 = String(y1)
      var y3 = y2.replace("}", R)
      var r = JSON.parse(y3);
      ALL.FastMatch2 = r; //打包好塞回去
      //以下處理data========================================
      var data_len = ALL.data.length;

      if (userName) {
        var U = userName
      } else {
        var U = Room_text
      }

      var N = {
        "RoomId": Room_text,
        "Name": (U + "✅"),
        "status": "normal",
        "Amount": 0,
        "Notice": true
      }
      ALL.data.splice(data_len, 0, N)
      //以下處理FastMatch===================================
      var data_len = ALL.data.length
      var Room_Name = ALL.data[data_len - 1].Name //這個已經有✅了!
      if (userName) {
        var U = userName
      } else {
        var U = Room_text
      }
      var R = ',"' + U + '✅":' + newcol + "}"
      var r = JSON.parse(String(JSON.stringify(ALL.FastMatch)).replace("}", R));
      ALL.FastMatch = r; //打包好塞回去

      var r = JSON.stringify(ALL);
      doc.setText(r); //寫入
      //以下處理sheetM的數值===================================================
      SheetM.getRange(1, newcol + 1).setValue("[1,0]")
      //以下處理sheet(寫入訊息)========================================================
      var col = ALL.FastMatch2[Room_text] + 1; //找欄位
      SheetM.getRange(2, col).setValue(String(text)) //更新內容
      SheetM.getRange(1, col).setValue(1) //更新數量
      //以下處理doc(寫入訊息)==========================================================
      ALL.data[col - 1].Amount = ALL.data[col - 1].Amount + 1 //!!!!!!!!!!!!!!!!!!!!!!
      var r = JSON.stringify(ALL);
      doc.setText(r); //寫入
      //以下處理RoomKeyboard==================================================
      REST_keyboard()
      //以下通知有新的ID進來===================================================
      if (userName) {
        var U = userName
      } else {
        var U = Room_text
      }
      text = "已有新ID登入!!! id =\n" + U + "\n請盡快重新命名。"
      var notification = false
      sendtext(text, notification);
    }
  } else {
    GmailApp.sendEmail("email", "telegram-line出事啦", d + "\n" + ee);
  }
}

//以下各類函式支援
//=====================================================================================================
function Log(estringa, from, sheet_key, email) {
  var ee = JSON.stringify(estringa);
  var d = new Date();
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var Sheet = SpreadSheet.getSheetByName("Log");
  var SheetLastRow = Sheet.getLastRow();
  switch (from) {
    case 'telegram':
      Sheet.getRange(SheetLastRow + 1, 1).setValue(d);
      Sheet.getRange(SheetLastRow + 1, 2).setValue("Telegram");
      Sheet.getRange(SheetLastRow + 1, 3).setValue(ee);
      break;
    case 'line':
      Sheet.getRange(SheetLastRow + 1, 1).setValue(d);
      Sheet.getRange(SheetLastRow + 1, 2).setValue("Line");
      Sheet.getRange(SheetLastRow + 1, 3).setValue(ee);
      break;
    default:
      GmailApp.sendEmail(email, "telegram-line出事啦", d + " " + ee);
  }
}
//=================================================================
function ReplyKeyboardRemove(text) {
  var ReplyKeyboardRemove = {
    'remove_keyboard': true,
    'selective': false
  }
  var payload = {
    "method": "sendMessage",
    'chat_id': "Telegram_id",
    'text': text,
    'reply_markup': JSON.stringify(ReplyKeyboardRemove)
  }
  start(payload);
}
//=================================================================================
function ReplyKeyboardMakeup(keyboard, resize_keyboard, one_time_keyboard, text) {
  var ReplyKeyboardMakeup = {
    'keyboard': keyboard,
    'resize_keyboard': resize_keyboard,
    'one_time_keyboard': one_time_keyboard,
  }
  var payload = {
    "method": "sendMessage",
    'chat_id': "Telegram_id",
    'text': text,
    'reply_markup': JSON.stringify(ReplyKeyboardMakeup)
  }
  start(payload);
}
//=================================================================================
function keyboard_main(text, doc_key) {
  var doc = DocumentApp.openById(doc_key)
  var f = doc.getText();
  var ALL = JSON.parse(f); //獲取資料//轉成JSON物件
  var keyboard_main = ALL.RoomKeyboard
  var resize_keyboard = false
  var one_time_keyboard = false
  ReplyKeyboardMakeup(keyboard_main, resize_keyboard, one_time_keyboard, text)
}
//=================================================================================
function In(name) {
  var arr = ["/main", "🔙 返回房間", "🔭 訊息狀態", "✔️ 關閉鍵盤", "🚀 發送訊息", "/exit", "📬 讀取留言",
    "🔖 重新命名", "🐳 開啟通知", "🔰 暫停通知", "🔃  重新整理", "🔥 刪除聊天室", "/delete"
  ];

  var flag = arr.some(function(value, index, array) {

    return value == name ? true : false;

  });
  return flag
}
//=================================================================================
function REST_keyboard() {
  var base_json = base()
  var doc = DocumentApp.openById(base_json.doc_key)
  var f = doc.getText();
  var ALL = JSON.parse(f); //獲取資料//轉成JSON物件
  var keyboard = [];
  var data_len = ALL.data.length;
  var T = data_len - 2 //因為要分兩欄故-2

  for (var i = 0; i <= T;) {

    if (ALL.data[i].Name) { //讓ND=暱稱，沒有就=Roomid
      var ND1 = ALL.data[i].Name
    } else {
      var ND1 = ALL.data[i].RoomId
    }
    if (ALL.data[i + 1].Name) { //讓ND=暱稱，沒有就=Roomid
      var ND2 = ALL.data[i + 1].Name
    } else {
      var ND2 = ALL.data[i + 1].RoomId
    }

    var A = [{
      'text': ND1
    }, {
      'text': ND2
    }]

    keyboard.splice(i, 0, A)
    i = i + 2;
  }
  if (data_len % 2) {
    var data_len2 = ALL.data.length - 1;
    var keyboard_len = keyboard.length

    if (ALL.data[data_len2].Name) { //讓ND=暱稱，沒有就=Roomid
      ND1 = ALL.data[data_len2].Name
    } else {
      ND1 = ALL.data[data_len2].RoomId
    }

    keyboard.splice(keyboard_len, 0, [{
      'text': ND1
    }])
  }

  keyboard.splice(0, 0, [{
    'text': "🔃  重新整理"
  }, {
    'text': "🔭 訊息狀態"
  }]) //加入返回鍵
  //=================================================
  ALL.RoomKeyboard = keyboard //寫回RoomKeynoard
  var r = JSON.stringify(ALL);
  doc.setText(r); //寫入
}
//=================================================================================
function REST_FastMatch1and2() { //重製快速索引
  var base_json = base()
  var doc_key = base_json.doc_key
  var doc = DocumentApp.openById(doc_key)
  var f = doc.getText();
  var ALL = JSON.parse(f); //獲取資料//轉成JSON物件

  var data_len = ALL.data.length
  ALL.FastMatch = {}
  ALL.FastMatch2 = {}
  for (var i = 0; i < data_len; i++) {
    var Name = ALL.data[i].Name
    ALL.FastMatch[Name] = i
  }
  for (var i = 0; i < data_len; i++) {
    var RoomId = ALL.data[i].RoomId
    ALL.FastMatch2[RoomId] = i
  }

  var r = JSON.stringify(ALL);
  doc.setText(r); //寫入
}
//=================================================================================
function AllRead() {
  var base_json = base()
  var sheet_key = base_json.sheet_key
  var doc_key = base_json.doc_key
  var doc = DocumentApp.openById(doc_key)
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var Sheet = SpreadSheet.getSheetByName("Line訊息區");

  var doc = DocumentApp.openById(doc_key)
  var f = doc.getText();
  var ALL = JSON.parse(f);
  var data_len = ALL.data.length
  var row1 = []
  for (var i = 0; i < data_len; i++) {
    ALL.data[i].Amount = 0
    row1.splice(i, 0, "[0,0]")
  }
  var LastCol = Sheet.getLastColumn();
  Sheet.clear();
  Sheet.appendRow(row1)

  var r = JSON.stringify(ALL);
  doc.setText(r); //寫入
}
//=================================================================================
function getUserName(userId) {
  var base_json = base()
  var CHANNEL_ACCESS_TOKEN = base_json.CHANNEL_ACCESS_TOKEN
  var header = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  }
  var options = {
    'headers': header,
    'method': 'get'
  }
  try {
    var profile = JSON.parse(UrlFetchApp.fetch("https://api.line.me/v2/bot/profile/" + userId, options))
    var userName = profile.displayName
  } catch (r) {
    var userName = "未知姓名"
  }
  return userName
}
//=================================================================================
function newGetUserName(userId, groupId) {
  var base_json = base()
  var CHANNEL_ACCESS_TOKEN = base_json.CHANNEL_ACCESS_TOKEN
  var header = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  }
  var options = {
    'headers': header,
    'method': 'get'
  }
  try {
    var profile = UrlFetchApp.fetch("https://api.line.me/v2/bot/group/" + groupId + "/member/" + userId, options)
    profile = JSON.parse(profile)
    var userName = profile.displayName
  } catch (r) {
    var userName = "未知姓名"
  }
  //Logger.log("TTTTTT = ",userName)
  //var notification = false
  //sendtext(profile, notification);
  //sendtext(userName, notification);

  return userName
}
//=================================================================================
function TG_Send_Photo_To_Line(Line_id, photo_id) {
  var base_json = base()
  var CHANNEL_ACCESS_TOKEN = base_json.CHANNEL_ACCESS_TOKEN;
  var G = TGdownloadURL(getpath(photo_id))

  var url = 'https://api.line.me/v2/bot/message/push';
  //--------------------------------------------------
  var retMsg = [{
    "type": "image",
    "originalContentUrl": G,
    "previewImageUrl": G
  }];
  var header = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  }
  var payload = {
    'to': Line_id,
    'messages': retMsg
  }
  var options = {
    'headers': header,
    'method': 'post',
    'payload': JSON.stringify(payload)
  }
  //--------------------------------------------------
  UrlFetchApp.fetch(url, options);
}
//=================================================================================
function getpath(id) {
  var base_json = base()
  var Telegram_bot_key = base_json.Telegram_bot_key
  url = "https://api.telegram.org/bot" + Telegram_bot_key + "/getFile?file_id=" + id
  var html = UrlFetchApp.fetch(url);
  html = JSON.parse(html);
  //Logger.log("TTTTTT = ",html);
  var path = html.result.file_path
  return path;
}
//=================================================================================
function TGdownloadURL(path) {
  var base_json = base()
  var Telegram_bot_key = base_json.Telegram_bot_key
  var TGDurl = "https://api.telegram.org/file/bot" + Telegram_bot_key + "/" + path
  return TGDurl;
}
//=================================================================================
function list() { //顯示指定資料夾資料

  var Folder = DriveApp.getFolderById("0B-0JNsk9kL8vandtakhDOWZhQms"); //暫存
  var Folder2 = DriveApp.getFolderById("0B-0JNsk9kL8vdjNXc3FSMjdjUWM"); //download_from_line
  var files = Folder2.getFiles();

  var sheet_key = "1ONW2e6kEmyUealjNfkNxK9GFmXCMua9YTZ3zMvu8FlE";
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var Sheet = SpreadSheet.getSheetByName("1");
  var LastRow = Sheet.getLastRow();

  Sheet.getRange(LastRow + 1, 1).setValue(Folder);

  var i = 0;
  while (files.hasNext()) {
    var file = files.next();
    //Sheet.getRange(LastRow +1+i, 5).setValue("Go");
    Sheet.getRange(LastRow + 1 + i, 2).setValue(file.getName());
    Sheet.getRange(LastRow + 1 + i, 3).setValue(file.getId());
    Sheet.getRange(LastRow + 1 + i, 4).setValue("https://drive.google.com/uc?export=download&id=" + file.getId());
    Sheet.getRange(LastRow + 1 + i, 5).setValue(file.getDownloadUrl());
    //Logger.log(file.getName());
    i = i + 1;
  }
}
//=================================================================================
function downloadFromLine() {
  //讓我們感謝河馬大大!m(_ _)m
  //https://riverhippo.blogspot.tw/2016/02/google-drive-direct-link.html
  var base_json = base()
  var CHANNEL_ACCESS_TOKEN = base_json.CHANNEL_ACCESS_TOKEN;
  var FolderId = base_json.FolderId;
  var Folder = DriveApp.getFolderById(FolderId); //download_from_line

  var id = "6477901931257";
  var url = 'https://api.line.me/v2/bot/message/' + id + '/content';
  //--------------------------------------------------
  var header = {
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
  }
  var options = {
    'headers': header,
    'method': 'get'
  }
  //--------------------------------------------------
  var blob = UrlFetchApp.fetch(url, options);
  Folder2.createFile(blob)
}
//=================================================================================
function CP() {
  var base_json = base()
  var sheet_key = base_json.sheet_key
  var doc_key = base_json.doc_key
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var Sheet = SpreadSheet.getSheetByName("JSON備份");
  var LastRow = Sheet.getLastRow();

  var doc = DocumentApp.openById(doc_key)
  var f = doc.getText();
  var d = new Date();
  Sheet.getRange(LastRow + 1, 1).setValue(d);
  Sheet.getRange(LastRow + 1, 2).setValue(f);
}
//=================================================================================
function sendtext(text, notification) {
  var payload = {
    "method": "sendMessage",
    'chat_id': "Telegram_id",
    'text': text,
    'disable_notification': notification
  } //上面的Telegram_id因為最後發送隊對象都相同，所以在start()中補。
  start(payload);
}
//=================================================================
function sendPhoto(url, notification) {
  var payload = {
    "method": "sendPhoto",
    'chat_id': "",
    'photo': url,
    'disable_notification': notification
  } //上面的Telegram_id因為最後發送隊對象都相同，所以在start()中補。
  start(payload);
}
//=================================================================================
function sendAudio(url, notification) {
  var payload = {
    "method": "sendAudio",
    'chat_id': "",
    'audio': url,
    'disable_notification': notification
  } //上面的Telegram_id因為最後發送隊對象都相同，所以在start()中補。
  start(payload);
}
//=================================================================
function sendVoice(url, notification) {
  var payload = {
    "method": "sendVoice",
    'chat_id': id,
    'voice': url,
    'disable_notification': notification
  } //上面的Telegram_id因為最後發送隊對象都相同，所以在start()中補。
  start(payload);
}
//=================================================================
function senddocument(url, notification) {
  var payload = {
    "method": "senddocument",
    'chat_id': "",
    'document': url,
    'disable_notification': notification
  } //上面的Telegram_id因為最後發送隊對象都相同，所以在start()中補。
  start(payload);
}
//=================================================================
function sendLocation(latitude, longitude, notification) {
  var payload = {
    "method": "sendLocation",
    "chat_id": "",
    "latitude": latitude,
    "longitude": longitude,
    'disable_notification': notification
  } //上面的Telegram_id因為最後發送隊對象都相同，所以在start()中補。
  start(payload);
}
//=================================================================================
function start(payload) {
  var base_json = base()
  var sheet_key = base_json.sheet_key
  var Telegram_bot_key = base_json.Telegram_bot_key
  var Telegram_id = base_json.Telegram_id
  payload.chat_id = Telegram_id //補上Telegram_id
  var data = {
    "method": "post",
    "payload": payload
  }
  UrlFetchApp.fetch("https://api.telegram.org/bot" + Telegram_bot_key + "/", data);
  /*/  為了速度和穩定 不必要就算了
  var d = new Date();
  var SpreadSheet = SpreadsheetApp.openById(sheet_key);
  var Sheet = SpreadSheet.getSheetByName("紀錄發送的訊息");
  var LastRow = Sheet.getLastRow();
  Sheet.getRange(LastRow + 1, 1).setValue(d);
  Sheet.getRange(LastRow + 1, 3).setValue(data);
  var returned = UrlFetchApp.fetch("https://api.telegram.org/bot" + Telegram_bot_key + "/", data);
  Sheet.getRange(LastRow + 1, 2).setValue(returned); //確認有發成功
  //*/
}
//=================================================================================
function TTTTTTTT() {
  var base_json = base()
  var sheet_key = base_json.sheet_key
  var doc_key = base_json.doc_key
  var email = base_json.email
  var Telegram_bot_key = base_json.Telegram_bot_key
  var Telegram_id = base_json.Telegram_id
  var Line_id = base_json.Line_id
  var CHANNEL_ACCESS_TOKEN = base_json.CHANNEL_ACCESS_TOKEN;

  //*/
  sendtext('["文字","Li","https://rff.ilc.edu.tw/prise/"]', true)
  //*/
}
