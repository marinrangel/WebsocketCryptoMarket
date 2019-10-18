const conf = require("./config");
const WebSocket = require("ws");

var _ws;

const binance = require("node-binance-api")().options({
  APIKEY: conf.BinanceApiKey,
  APISECRET: conf.BinanceApiSecret,
  useServerTime: true
});

const wss = new WebSocket.Server({
  port: 3001,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

wss.on("connection", function connection(ws) {
  _ws = ws;

  ws.on("message", function incoming(message) {
    ws.room = [];

    message = JSON.parse(message);

    if (message.join) {
      console.log("asigno room: " + message.room);
      ws.room.push(message.join);
    }
  });

  ws.send(
    JSON.stringify({
      mensaje: "CF - BeeScreener: Successful connection..."
    })
  );
  console.log("New connection");
});

wss.on("close", function(code) {
  console.log("Disconnected: " + code);
});

wss.on("error", function(error) {
  console.log("Error: " + error.code);
});

const wsInicialice = async () => {
  var symbols = ['BNBBTC'];
  binance.websockets.candlesticks(symbols, "1m", candlesticks => {
    let { e: eventType, E: eventTime, s: symbol, k: ticks } = candlesticks;
    let {
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume,
      n: trades,
      i: interval,
      x: isFinal,
      q: quoteVolume,
      V: buyVolume,
      Q: quoteBuyVolume
    } = ticks;

    var instrumento = {
      symbol: symbol,
      price: close,
      eventType: eventType,
      eventTime: eventTime,
      open: open,
      high: high,
      low: low,
      close: close,
      volume: volume,
      trades: trades,
      interval: interval,
      isFinal: isFinal,
      quoteVolume: quoteVolume,
      buyVolume: buyVolume,
      quoteBuyVolume: quoteBuyVolume
    };
    console.log(
      "Time: ",
      instrumento.eventTime + ", Symbol: " + instrumento.symbol
    );
    sendMenssage(instrumento);
  });
};

const sendMenssage = async tick => {
  wss.clients.forEach(client => {
    if (
      client.room &&
      client.room.length > 0 &&
      client.room.indexOf(tick.symbol) > -1
    ) {
      client.send(JSON.stringify(tick));
    }
  });
};

wsInicialice();
