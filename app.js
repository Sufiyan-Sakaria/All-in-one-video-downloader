const express = require("express");
const path = require("path");
const app = express();
const instagramGetUrl = require("priyansh-ig-downloader");
const ytdl = require("ytdl-core");
const fs = require("fs");
const { log } = require("console");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/download-instagram", (req, res) => {
  const url = req.body.isUrl;
  async function downloadMedia() {
    try {
      const download = await instagramGetUrl(url);
      const downloadlink = download.url_list[0];
      res.redirect(downloadlink);
    } catch (error) {
      console.error(error);
    }
  }
  downloadMedia();
});

// Endpoint to handle YouTube video download
app.post("/download-youtube", async (req, res) => {
  const url = req.body.ytUrl;

  try {
    const videoInfo = await ytdl.getBasicInfo(url);
    const title = videoInfo.videoDetails.title;
    const videos = videoInfo.formats;

    // Find the format with quality hd720
    let format = videos.find(
      (video) => video.width == 1920 && video.height == 1080
    );

    if (format === undefined) {
      format = videos.find(
        (video) => video.width == 1280 && video.height == 720
      );
      if (format === undefined) {
        format = videos.find(
          (video) => video.width == 854 && video.height == 480
        );
        if (format === undefined) {
          format = videos.find(
            (video) => video.width == 640 && video.height == 360
          );
        }
      }
    }

    console.log(format);

    if (!format) {
      return res.status(404).send("No suitable video found for download.");
    }

    // Set response headers for file download
    res.setHeader("Content-disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-type", "video/mp4");

    // Pipe the video stream to the response
    ytdl(url, { format: format }).pipe(res);
  } catch (error) {
    console.log("Error fetching video info:" + error.message);
    res.status(500).send("Error fetching video info.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
