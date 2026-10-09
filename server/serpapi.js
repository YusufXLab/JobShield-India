// ============================================================
// server/serpapi.js — SerpApi Data Gathering Module
// ============================================================
// This module handles all communication with SerpApi.
//
// Currently implemented:
//   1. searchGoogleJobs(query) — Search Google Jobs for listings
//   2. searchGoogleComplaints(query) — Google web search for scam reports
//   3. searchGoogleNews(query) — Google News for press coverage
//
// Coming later:
//   4. gatherAllEvidence(query) — calls all of the above in parallel
// ============================================================

// --- Import the SerpApi helper ---
// getJson sends a request to SerpApi and returns the parsed response.
const { getJson } = require("serpapi");

// --- Read the API key from .env ---
// dotenv.config() must have been called BEFORE this module is loaded,
// which happens in server/index.js (or in our test file).
// We grab the key once and reuse it for every request.
const API_KEY = process.env.SERPAPI_KEY;

// ============================================================
// searchGoogleJobs(query)
// ============================================================
// What it does:
//   1. Sends a search to SerpApi using the "google_jobs" engine.
//   2. Receives the raw response (which contains a LOT of data).
//   3. Picks out only the useful fields from each job listing.
//   4. Returns a clean array of simple objects.
//
// Parameters:
//   query  — a search string, e.g. "TCS jobs India"
//
// Returns:
//   An object with:
//     success  — true if the request worked, false if it failed
//     count    — how many jobs were found
//     jobs     — an array of clean job objects
//     error    — error message (only present when success is false)
// ============================================================
async function searchGoogleJobs(query) {
  // Safety check: make sure the key exists
  if (!API_KEY) {
    return {
      success: false,
      count: 0,
      jobs: [],
      error: "SERPAPI_KEY is missing from .env",
    };
  }

  try {
    // --- Send the request to SerpApi ---
    const rawResult = await getJson({
      engine: "google_jobs",   // use Google Jobs (not regular Google)
      q: query,                // the search query
      gl: "in",                // country: India
      hl: "en",                // language: English
      api_key: API_KEY,        // authenticate (never exposed to the user)
    });

    // --- Extract only the useful fields ---
    // SerpApi returns an array called "jobs_results".
    // Each item has many fields; we only keep what we need.
    const rawJobs = rawResult.jobs_results || [];

    const cleanJobs = rawJobs.map((job) => ({
      title: job.title || "Unknown title",
      company: job.company_name || "Unknown company",
      location: job.location || "Not specified",
      description: job.description
        ? job.description.substring(0, 200) + "…"   // first 200 chars only
        : "No description available",
      link: job.share_link || job.related_links?.[0]?.link || null,
      // --- Apply options: direct links to the actual job listing ---
      // SerpApi returns an array of places where the user can apply
      // (e.g. company website, Naukri, Indeed). We keep only title + link.
      // If apply_options is missing, we default to an empty array.
      applyOptions: (job.apply_options || []).map((opt) => ({
        title: opt.title || "Unknown source",
        link: opt.link || null,
      })),
    }));

    return {
      success: true,
      count: cleanJobs.length,
      jobs: cleanJobs,
    };

  } catch (err) {
    return {
      success: false,
      count: 0,
      jobs: [],
      error: err.message || String(err),
    };
  }
}

// ============================================================
// searchGoogleComplaints(query)
// ============================================================
// What it does:
//   1. Sends a regular Google Search via SerpApi.
//   2. The query is designed to surface scam reports, fraud
//      complaints, and negative reviews about a company.
//   3. Picks out only the useful fields from each organic result.
//   4. Returns a clean array of simple objects.
//
// Parameters:
//   query  — a search string, e.g. "TCS scam fraud complaints jobs"
//
// Returns:
//   An object with:
//     success  — true if the request worked, false if it failed
//     count    — how many organic results were found
//     results  — an array of clean result objects
//     error    — error message (only present when success is false)
// ============================================================
async function searchGoogleComplaints(query) {
  // Safety check: make sure the key exists
  if (!API_KEY) {
    return {
      success: false,
      count: 0,
      results: [],
      error: "SERPAPI_KEY is missing from .env",
    };
  }

  try {
    // --- Send the request to SerpApi ---
    const rawResult = await getJson({
      engine: "google",          // regular Google web search
      q: query,                  // the search query
      gl: "in",                  // country: India
      hl: "en",                  // language: English
      num: 10,                   // ask for 10 results
      api_key: API_KEY,          // authenticate (never exposed to the user)
    });

    // --- Extract only the useful fields ---
    // SerpApi returns an array called "organic_results".
    // Each item has many fields; we only keep title, link, snippet.
    const rawResults = rawResult.organic_results || [];

    const cleanResults = rawResults.map((item) => ({
      title: item.title || "No title",
      link: item.link || null,
      snippet: item.snippet || "No snippet available",
    }));

    return {
      success: true,
      count: cleanResults.length,
      results: cleanResults,
    };

  } catch (err) {
    return {
      success: false,
      count: 0,
      results: [],
      error: err.message || String(err),
    };
  }
}

// ============================================================
// searchGoogleNews(query)
// ============================================================
// What it does:
//   1. Sends a Google News search via SerpApi.
//   2. The query surfaces news articles about a company —
//      especially scam reports, fraud, and negative press.
//   3. Picks out only the useful fields from each news result.
//   4. Returns a clean array of simple objects.
//
// Important: Google News results have a DIFFERENT structure
// than regular Google results:
//   - "source" is an object: { name: "...", icon: "..." }
//     We extract only source.name.
//   - There is no "snippet" field. News results have only a title.
//   - Dates come as "date" (human-readable) and "iso_date".
//
// Parameters:
//   query  — a search string, e.g. "TCS scam fraud jobs"
//
// Returns:
//   An object with:
//     success  — true if the request worked, false if it failed
//     count    — how many news results were found
//     results  — an array of clean news objects
//     error    — error message (only present when success is false)
// ============================================================
async function searchGoogleNews(query) {
  // Safety check: make sure the key exists
  if (!API_KEY) {
    return {
      success: false,
      count: 0,
      results: [],
      error: "SERPAPI_KEY is missing from .env",
    };
  }

  try {
    // --- Send the request to SerpApi ---
    const rawResult = await getJson({
      engine: "google_news",     // Google News (not regular Google)
      q: query,                  // the search query
      gl: "in",                  // country: India
      hl: "en",                  // language: English
      api_key: API_KEY,          // authenticate (never exposed to the user)
    });

    // --- Extract only the useful fields ---
    // SerpApi returns an array called "news_results".
    // Each item has: title, link, source (object), date, iso_date.
    // There is NO snippet field for news results.
    const rawResults = rawResult.news_results || [];

    const cleanResults = rawResults.map((item) => ({
      title: item.title || "No title",
      link: item.link || null,
      // source is an object like { name: "ETHRWorld.com", icon: "..." }
      // We only need the name.
      source: item.source?.name || "Unknown source",
      date: item.date || null,
    }));

    return {
      success: true,
      count: cleanResults.length,
      results: cleanResults,
    };

  } catch (err) {
    return {
      success: false,
      count: 0,
      results: [],
      error: err.message || String(err),
    };
  }
}

async function gatherAllEvidence(query) {
  const jobsQuery = `${query} jobs`;
  const complaintsQuery = `${query} scam fraud complaints jobs`;
  const newsQuery = `${query} scam fraud jobs`;

  const [jobs, searchResults, newsResults] = await Promise.all([
    searchGoogleJobs(jobsQuery),
    searchGoogleComplaints(complaintsQuery),
    searchGoogleNews(newsQuery),
  ]);

  console.log("JOBS:", jobs.count);
  console.log("SEARCH:", searchResults.count);
  console.log("NEWS:", newsResults.count);

  return {
    query,
    jobs,
    searchResults,
    newsResults,
  };
}

module.exports = {
  searchGoogleJobs,
  searchGoogleComplaints,
  searchGoogleNews,
  gatherAllEvidence,
};
