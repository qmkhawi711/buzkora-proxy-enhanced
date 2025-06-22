
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send("URL is required");
    }

    const isM3U8 = url.endsWith(".m3u8");

    const response = await axios.get(url, {
      headers: {
        Referer: "https://pl.buzkora.online/albaplayer/1bein1/?serv=2",
        Origin: "https://pl.buzkora.online",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36",
      },
      responseType: isM3U8 ? "text" : "stream",
    });

    if (isM3U8) {
      // Rewrite .ts URLs in the m3u8 content to pass through the proxy
      let playlist = response.data;
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
      playlist = playlist.replace(/(.*\.ts)/g, (match, p1) => {
        const tsUrl = p1.startsWith("http") ? p1 : baseUrl + p1;
        return `https://buzkora-proxy.onrender.com/stream?url=${encodeURIComponent(tsUrl)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.send(playlist);
    } else {
      res.set({
        "Content-Type": response.headers["content-type"] || "video/MP2T",
      });
      response.data.pipe(res);
    }
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Enhanced Proxy running on port ${PORT}`));
