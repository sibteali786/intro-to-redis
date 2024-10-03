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
function cache(key, ttl, slowFn) {
  return async function cachedFn(...props) {
    const cachedResponse = await client.get(key);
    if (cachedResponse) {
      return cachedResponse;
    }
    const result = await slowFn(...props);
    await client.setEx(key, ttl, result);
    return result;
  };
}
async function verySlowAndExpensivePostgresSQLQuery() {
  console.log("an expensive query");
  const promise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Date().toUTCString());
    }, 5000);
  });
  return promise;
}
const cachedFn = cache(
  "expensive_call",
  10,
  verySlowAndExpensivePostgresSQLQuery,
);
async function init() {
  const app = express();
  const PORT = 3000;

  // Serve static files from the "static" directory
  app.use(express.static("./static"));
  app.get("/get", async (req, res) => {
    const data = await cachedFn();
    res
      .json({
        status: "ok",
        data,
      })
      .end();
  });
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
