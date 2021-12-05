const TelegramBot = require('node-telegram-bot-api')
const { createCanvas, loadImage, ImageData } = require('canvas')
const dotenv = require('dotenv');
const moment = require('moment');
const users = require('./db').users;
const frameData = require('./frames.json');
const path = require('path');

dotenv.config();

if (!process.env.TELEGRAM_TOKEN) {
  console.error('TELEGRAM_TOKEN environment variable is missing. Can\'t start.')
  process.exit(1)
}

let bot;
if (process.env.WEBHOOK_URL) {
  bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
    webHook: {
      port: process.env.WEBHOOK_PORT || 3000
    }
  });
  bot.setWebHook(process.env.WEBHOOK_URL);
}
else {
  bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
}

const printTemplate = t => {
  let md = frameData[t];
  if (!md) return 'Invalid template.';
  return `${t} - recommended size ${md.drawArea[2]}x${md.drawArea[3]}px - Credits: ${md.credits}`;
}

bot.on('message', async (msg) => {
  if (!users[msg.chat.id]) users[msg.chat.id] = {};
  if (msg.document) {
    return bot.sendMessage(msg.chat.id, 'Send the picture as photo, not as file!').catch(console.log)
  }
  if (!msg.photo) {
    return;
  }
  let u = users[msg.chat.id];
  if (!u.template || !frameData[u.template]) {
    return bot.sendMessage(msg.chat.id, 'You have to tell me the template first. Type /templates to see, /template <template> to choose!').catch(console.log)
  }
  const { width, height, drawArea, cityArea, dateArea, nickArea } = frameData[u.template];
  if (cityArea && cityArea.length && !u.location) {
    return bot.sendMessage(msg.chat.id, 'You have to tell me the location first. Type /location <location> to choose!').catch(console.log)
  }
  bot.sendChatAction(msg.chat.id, 'upload_photo').catch(console.error)
  const { file_path } = await bot.getFile(msg.photo[msg.photo.length - 1].file_id)
  const picture = await loadImage(`https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file_path}`);
  let pw = picture.width, ph = picture.height;
  let x = drawArea[0], y = drawArea[1], w = drawArea[2], h = drawArea[2] * ph / pw;
  if (h < drawArea[3]) {
    h = drawArea[3];
    w = h * pw / ph;
    x = x - ((w - drawArea[2]) / 2);
  }
  if (h > drawArea[3]) {
    y = y - ((h - drawArea[3]) / 2);
  }
  const finalCanvas = createCanvas(width, height);
  const finalCtx = finalCanvas.getContext('2d')
  const frame = await loadImage(path.join(__dirname, 'frames', `${u.template}.png`));
  finalCtx.drawImage(picture, x, y, w, h)
  finalCtx.drawImage(frame, 0, 0, width, height)
  finalCtx.textBaseline = 'top';
  finalCtx.fillStyle = '#FFF';
  if (cityArea && cityArea.length) {
    finalCtx.font = cityArea[3] + 'px Arial';
    finalCtx.fillText(u.location, cityArea[0], cityArea[1], cityArea[2]);
  }
  if (dateArea && dateArea.length) {
    let date = u.date ? u.date : moment().format('DD/MM/YY');
    finalCtx.font = dateArea[3] + 'px Arial';
    finalCtx.fillText(date, dateArea[0], dateArea[1], dateArea[2]);
  }
  if (nickArea && nickArea.length) {
    let nick = u.nick ? u.nick : msg.from.username;
    finalCtx.font = nickArea[3] + 'px Arial';
    finalCtx.fillText(nick, nickArea[0], nickArea[1], nickArea[2]);
  }
  bot.sendPhoto(msg.chat.id, finalCanvas.toBuffer('image/png', { quality: 1 }))
});

bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, `*Use this bot to generate a Biocard.*
  *Available commands:*
    /templates - See all Templates
    /template - See current Template
    /template <template> - Select a template
    /date - Reset date to current
    /date <date> - Set date
    /nick <nickname> - Set nickname
    /location - See current location
    /location <location> - Update your location
  `, { parse_mode: 'markdown' }).catch(console.log)
});

bot.onText(/\/template(.*)/, (msg, match) => {
  let t = match[1].trim();
  if (t === 's') return bot.sendMessage(msg.chat.id, `*Available templates:* \n  ${Object.keys(frameData).map(printTemplate).join('\n  ')}`, { parse_mode: 'markdown' }).catch(console.log);
  if (!t) {
    let curTemplate = users[msg.chat.id].template;
    if (!curTemplate) return bot.sendMessage(msg.chat.id, 'No template selected. Use /template to see available templates.').catch(console.log);
    return bot.sendMessage(msg.chat.id, `*Current template:* ${printTemplate(curTemplate)}`, { parse_mode: 'Markdown' }).catch(console.log);
  }
  if (frameData[t]) {
    users[msg.chat.id].template = t;
    let { drawArea } = frameData[t];
    return bot.sendMessage(msg.chat.id, `Great! Recommended size for this template is *${drawArea[2]}x${drawArea[3]}px.*`, { parse_mode: 'Markdown' }).catch(console.log)
  }
  return bot.sendMessage(msg.chat.id, 'Invalid template.').catch(console.log)
});

bot.onText(/\/location(.*)/, (msg, match) => {
  let t = match[1].trim();
  if (!t) {
    if (users[msg.chat.id].location)
      return bot.sendMessage(msg.chat.id, `Your saved location is ${users[msg.chat.id].location}.`).catch(console.log)
    return bot.sendMessage(msg.chat.id, `No location set.`).catch(console.log)
  }
  users[msg.chat.id].location = t;
  return bot.sendMessage(msg.chat.id, `Great! Your location is now ${t}.`).catch(console.log)
});

bot.onText(/\/nick(.*)/, (msg, match) => {
  let t = match[1].trim();
  if (!t) {
    return bot.sendMessage(msg.chat.id, `Your nickname is ${users[msg.chat.id].nick || msg.from.username}.`).catch(console.log)
  }
  users[msg.chat.id].nick = t;
  return bot.sendMessage(msg.chat.id, `Great! Your nickname is now ${t}.`).catch(console.log)
});

bot.onText(/\/date(.*)/, (msg, match) => {
  let t = match[1].trim();
  if (!t) {
    users[msg.chat.id].date = undefined;
    return bot.sendMessage(msg.chat.id, 'Date reset to current date.');
  }
  users[msg.chat.id].date = t;
  return bot.sendMessage(msg.chat.id, 'Great! Now send me the picture you want to make the badge with. Use a picture with recommended proportions, otherwise it will get squished.').catch(console.log)
});