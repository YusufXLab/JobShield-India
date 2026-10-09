# 🛡️ JobShield India

JobShield India helps Indian job seekers investigate whether a job opportunity looks legitimate or potentially fraudulent. It collects information from online sources and presents evidence and risk indicators to support informed decisions.

**Built for the SerpApi India Hackathon 2026.**

## 🚀 Quick Start

### 1. Install dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

**Windows PowerShell note:** If `npm` is blocked by your system's execution policy, use:

```powershell
npm.cmd install
```

### 2. Configure your SerpApi key

Open the `.env` file and replace the placeholder with your actual SerpApi key.

```env
SERPAPI_KEY=your_serpapi_key_here
```

Use the environment variable name expected by the project code. **Never share your real API key or upload your `.env` file to GitHub.**

### 3. Start the server

```bash
npm start
```

In Windows PowerShell, you can use:

```powershell
npm.cmd start
```

### 4. Open JobShield India

Visit http://localhost:3000 in your browser while the server is running.

## 📁 Project Structure

```text
server/
  index.js       Express server entry point
  serpapi.js     SerpApi data-gathering functions
  analyzer.js    Evidence analysis and risk scoring

public/
  index.html     Main HTML page
  style.css      Website styling
  app.js         Frontend logic
```

## 🧰 Tech Stack

* **Backend:** Node.js and Express
* **Frontend:** HTML, CSS and Vanilla JavaScript
* **Data source:** SerpApi, using Google Jobs, Google Search and Google News
* **Investigation history:** Browser local storage

## ⚠️ Important Note

JobShield's results are risk indicators, not a guarantee that a job is legitimate or fraudulent. Search results may be incomplete or unrelated to a specific vacancy. Always verify opportunities through official company channels, and be cautious about requests for payment during recruitment.

## 🔐 Security

* Keep API keys in `.env`.
* Ensure `.env` and `node_modules/` are listed in `.gitignore`.
* Never publish API keys in your source code, README or public repository.
