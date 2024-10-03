const express = require("express");
const { createClient } = require("redis");

const client = createClient(); // Create Redis client

// Handle errors
client.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis server
(async () => {
  await client.connect(); // Connect to Redis
  console.log("Connected to Redis");
})();

async function init() {
  const app = express();
  const PORT = 3000;

  // Serve static files from the "static" directory
  app.use(express.static("./static"));

  // Define the /pageview route
  app.get("/pageview", async (req, res) => {
    try {
      const views = await client.incr("pageviews"); // Increment pageviews
      res.json({
        status: "OK",
        views,
      });
    } catch (err) {
      console.error("Error incrementing pageviews:", err);
      res
        .status(500)
        .json({ status: "ERROR", message: "Internal Server Error" });
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

init();
