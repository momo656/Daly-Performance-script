//npm i github:pedroslopez/whatsapp-web.js && npm i wwebjs-mongo --> for remote auth 

const qr = require('qrcode-terminal');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const express = require("express");
const QRCode = require("qrcode");
const path = require("path");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./client_secret.json");

let client;



const cron = require("node-cron");
//http://localhost:3000/qr.png

const app = express();

let task = cron.schedule("*/10 * * * *", () => {
  //https://crontab.guru/
  getDataAndSendToWhatsApp();
});

app.use(express.static("public"));
mongoose.connect("mongodb+srv://momo:XQAWBC3va2PDt1ai@cluster0.afwrizd.mongodb.net/?retryWrites=true&w=majority").then(() => {
  
    const store = new MongoStore({ mongoose: mongoose });
     client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            args: [
                '--no-sandbox',
            ],
        },
    });

    client.on("qr", (qr) => {
      console.log(qr)
      QRCode.toFile(path.join(__dirname, "public") + "/qr.png", qr, {
        errorCorrectionLevel: "L",
        scale: 10,
      });
    
    });

    client.initialize();
});



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
  let DphBetween = DphBetweenRow[yesterday];
  let DphAll = DphAllRow[yesterday];

  client.sendMessage(
    "120363093617674901@g.us",
    `logistics delivery time performance\n${yesterday}\nTotalShifted: ${TotalShifted}\nLate: ${Late}\nDelivery time: ${deliveryTime} min\nMorning: ${morning} min\nBetween: ${between} min\nNight: ${night} min\nHourly AVG Order Morning: ${DphMorning}\nHourly AVG Order Between: ${DphBetween}\nHourly AVG Order per DA : ${DphAll}\n `
  );


};
const subtractDays = (date, days) => {
  date.setDate(date.getDate() - days);

  return date;


};
