// ============================================================
// server/index.js — Express Server (Entry Point)
// ============================================================
// This is the main file that starts our web server.
//
// What it does:
//   1. Loads environment variables from .env (like our SerpApi key)
//   2. Creates an Express app
//   3. Serves the frontend files from the public/ folder
//   4. Defines API routes that the frontend can call
//   5. Starts listening on a port (default 3000)
//
// Right now we only have a health-check endpoint.
// We will add the /api/investigate endpoint in a later phase.
// ============================================================

// --- Step 1: Load environment variables ---
// dotenv reads the .env file and makes its values available
// as process.env.VARIABLE_NAME (e.g., process.env.SERPAPI_KEY)
const dotenv = require("dotenv");
dotenv.config();

// --- Step 2: Import Express ---
const express = require("express");
const path = require("path");
const { gatherAllEvidence } = require("./serpapi");
const { analyzeEvidence } = require("./analyzer");

// --- Step 3: Create the Express app ---
const app = express();

// --- Step 4: Configure middleware ---

// express.json() lets the server understand JSON request bodies.
// When the frontend sends { "query": "Wipro" }, Express will
// automatically parse it into req.body.query
app.use(express.json());

// express.static() serves files from a folder directly to the browser.
// Any file inside public/ (like index.html, style.css, app.js)
// will be accessible at http://localhost:3000/filename
app.use(express.static(path.join(__dirname, "..", "public")));

// --- Step 5: Define routes ---

// Health-check endpoint
// This is a simple route that tells us the server is running.
// It's useful for testing and debugging — if this works,
// we know Express is set up correctly.
//
// Try it: open http://localhost:3000/api/health in your browser
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "JobShield India server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Investigation endpoint
app.post("/api/investigate", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        error: "Please provide a company name or job query."
      });
    }

    const cleanQuery = query.trim();

    console.log(`🔎 Investigating: ${cleanQuery}`);

    const evidence = await gatherAllEvidence(cleanQuery);

    const analysis = analyzeEvidence({
      query: cleanQuery,
      jobs: evidence.jobs.jobs,
      searchResults: evidence.searchResults.results,
      newsResults: evidence.newsResults.results
    });

    res.json({
      success: true,
      query: cleanQuery,
      evidence,
      analysis
    });

  } catch (error) {
    console.error("Investigation error:", error);

    res.status(500).json({
      success: false,
      error: "Something went wrong during investigation.",
      details: error.message
    });
  }
});

// --- Step 6: Start the server ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("===========================================");
  console.log("  🛡️  JobShield India Server is running!");
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  💡  Health check: http://localhost:${PORT}/api/health`);
  console.log("===========================================");
});
