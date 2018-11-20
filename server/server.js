const express = require("express");
var path = require("path");

const app = express();
const port = 4003;

const allowedExt = [
  ".js",
  ".ico",
  ".css",
  ".png",
  ".jpg",
  ".woff2",
  ".woff",
  ".ttf",
  ".svg"
];

app.get("*", (req, res) => {
  if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
    res.sendFile(path.join(__dirname + `/dist/${req.url}`));
  } else {
    res.sendFile(path.join(__dirname + "/dist/index.html"));
  }
});

app.listen(port, () =>
  console.debug(`TradingTracker listening on port ${port}!`)
);
