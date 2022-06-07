const dotenv = require("dotenv");
const cors = require("cors");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

dotenv.config({ path: "./config/config.env" });
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});

let uri =
  "mongodb+srv://mateus:" +
  process.env.PW +
  "@fcc.oynfh.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: Number,
});

let Url = mongoose.model("Url", urlSchema);
let responseObject = {};

app.post(
  "/api/shorturl",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let inputUrl = req.body["url"];

    let urlRegex = new RegExp(
      /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
    );

    if (!inputUrl.match(urlRegex)) {
      res.json({ error: "Invalid URL" });
      return;
    }

    responseObject["original_url"] = inputUrl;

    let inputShort = 1;

    Url.findOne({})
      .sort({ short: "desc" })
      .exec((error, result) => {
        if (!error && result != undefined) {
          inputShort = result.short + 1;
        }
        if (!error) {
          Url.findOneAndUpdate(
            { original: inputUrl },
            { original: inputUrl, short: inputShort },
            { new: true, upsert: true },
            (error, savedUrl) => {
              if (!error) {
                responseObject["short_url"] = savedUrl.short;
                res.json(responseObject);
              }
            }
          );
        }
      });
  }
);

app.get("/api/shorturl/:input", (req, res) => {
  Url.findOne({ short: req.params.input }, (error, result) => {
    if (!error && result != undefined) {
      res.redirect(result.original);
    } else {
      res.json("URL not found.");
    }
  });
});
