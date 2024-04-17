# Biocard Maker [![Try it on telegram](https://img.shields.io/badge/try%20it-on%20telegram-0088cc.svg)](http://t.me/biocardmakerbot)

**Biocard Maker** is a Telegram bot that turns your pictures into [Ingress](http://www.ingress.com/) biocards. Inspired by pedrofracassi's [badge maker bot](https://github.com/pedrofracassi/badgemaker), made with [node-canvas](https://github.com/Automattic/node-canvas).

For suggestions, help or to contribute with new features or frames, contact @DrJest on Telegram.

Frame Format

```
width: number
height: number
drawArea: [
  x,
  y,
  width,
  height
],
cityArea?: [
  x,
  y,
  width,
  height
],
nickArea: [
  x,
  y,
  width,
  height
],
dateArea?: [
  x,
  y,
  width,
  height
],
font: {
  color: string,    // #rrggbb - default: #ffffff
  align: string,    // left|center|right - default: left
  font: string,     // {bold|italic}? size font - default: 20px Arial
},
credits: string
```
