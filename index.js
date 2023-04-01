const express = require("express");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const path = require("path");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./client_secret.json");

const app = express();
const client = new Client({ authStrategy: new LocalAuth() });
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

const cron = require("node-cron");
//http://localhost:3000/qr.png

let task = cron.schedule("*/10 * * * *", () => {
  //https://crontab.guru/
  getDataAndSendToWhatsApp();
});

app.use(express.static("public"));

client.on("qr", (qr) => {
  console.log(qr)
  QRCode.toFile(path.join(__dirname, "public") + "/qr.png", qr, {
    errorCorrectionLevel: "L",
    scale: 10,
  });

});
mongoose.connect(process.env.MONGODB_URI).then(() => {
  const store = new MongoStore({ mongoose: mongoose });
  const client = new Client({
      authStrategy: new RemoteAuth({
          store: store,
          backupSyncIntervalMs: 300000
      })
  });

  client.initialize();
});

// client.on("message", (msg) => {
// // msg.getChat().then((chat) => {
// //   console.log(msg.id);
// //   console.log(msg.id.remote);
// //   console.log(chat.isGroup);
// // });
// console.log(msg)
// });


app.listen(3000);
const doc = new GoogleSpreadsheet(
  "1wsJIiixzDZwQ31TkYN7U-kCMUoggJsphjS2tnX6jDEg"
);


const getDataAndSendToWhatsApp = async () => {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  let rows = await sheet.getRows();
  const yesterday = subtractDays(new Date(), 1).toLocaleDateString();
  let TotalShiftedRow = rows[14];
  let LateRow = rows[22]; 
  let deliveryTimeRow = rows[24];
  let morningRow = rows[26];
  let betweenRow = rows[27];
  let nightRow = rows[28];
  let DphMorningRow = rows[43];
  let DphBetweenRow = rows[45];
  let DphAllRow = rows[46];

  let TotalShifted = TotalShiftedRow[yesterday];
  let Late = LateRow[yesterday];    
  let deliveryTime = deliveryTimeRow[yesterday];
  let morning = morningRow[yesterday];
  let between = betweenRow[yesterday];
  let night = nightRow[yesterday];
  let DphMorning = DphMorningRow[yesterday];
  let DphBetween = DphBetweenRow [yesterday];
  let DphAll = DphAllRow[yesterday];
 
    console.log();
    client.sendMessage(
      "120363093617674901@g.us",
      `logistics delivery time performance\n${yesterday}\nTotalShifted: ${TotalShifted}\nLate: ${Late}\nDelivery time: ${deliveryTime} min\nMorning: ${morning} min\nBetween: ${between} min\nNight: ${night} min\nHourly AVG Order Morning: ${DphMorning}\nHourly AVG Order Between: ${DphBetween}\nHourly AVG Order per DA : ${DphAll}\n `
    );
  
 
};

const subtractDays = (date, days) => {
  date.setDate(date.getDate() - days);

  return date;
  
  
};
