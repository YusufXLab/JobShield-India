function normalizeText(text) {
  if (!text) return "";
  return String(text).toLowerCase().replace(/\s+/g, " ").trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildEvidenceText(evidence) {
  const parts = [];

  for (const job of safeArray(evidence.jobs)) {
    parts.push(job.title);
    parts.push(job.company);
    parts.push(job.location);
    parts.push(job.description);

    for (const option of safeArray(job.applyOptions)) {
      parts.push(option.title);
    }
  }

  for (const result of safeArray(evidence.searchResults)) {
    parts.push(result.title);
    parts.push(result.snippet);
  }

  for (const article of safeArray(evidence.newsResults)) {
    parts.push(article.title);
    parts.push(article.source);
  }

  return normalizeText(parts.join(" "));
}

function detectRedFlags(evidence) {
  const flags = [];

  const jobs = safeArray(evidence.jobs);
  const searches = safeArray(evidence.searchResults);
  const news = safeArray(evidence.newsResults);

  // Combine each source separately.
  // This prevents one warning article from cancelling
  // a genuine scam report somewhere else.
  const searchTexts = searches.map(item =>
    normalizeText(
      `${item.title || ""} ${item.snippet || ""}`
    )
  );

  const newsTexts = news.map(item =>
    normalizeText(
      `${item.title || ""} ${item.source || ""}`
    )
  );

  const allTexts = [...searchTexts, ...newsTexts];

  // --------------------------------------------------
  // --------------------------------------------------
  // R1 — Upfront payment request
  // --------------------------------------------------

  const directPaymentKeywords = [
    "asked to pay",
    "required to pay",
    "must pay",
    "need to pay",
    "pay a registration fee",
    "pay registration fee",
    "pay an application fee",
    "pay application fee",
    "pay a processing fee",
    "pay processing fee",
    "pay a training fee",
    "pay training fee",
    "pay a security deposit",
    "pay security deposit",
    "registration fee required",
    "application fee required",
    "processing fee required",
    "training fee required",
    "security deposit required",
    "payment required to apply"
  ];

  const paymentMatches = allTexts.flatMap(text =>
    directPaymentKeywords.filter(keyword =>
      text.includes(keyword)
    )
  );

  if (paymentMatches.length > 0) {
    flags.push({
      id: "R1",
      name: "Upfront payment request",
      points: 35,
      matchedKeywords: [...new Set(paymentMatches)]
    });
  }

  // --------------------------------------------------
  // R2 — Payment to secure job
  // --------------------------------------------------

  const jobPaymentKeywords = [
    "pay to secure",
    "pay to confirm",
    "pay for interview",
    "money to get the job",
    "pay to get selected",
    "job confirmation fee",
    "pay to receive the offer",
    "pay before joining",
    "pay before you join"
  ];

  const jobPaymentMatches = allTexts.flatMap(text =>
    jobPaymentKeywords.filter(keyword =>
      text.includes(keyword)
    )
  );

  if (jobPaymentMatches.length > 0) {
    flags.push({
      id: "R2",
      name: "Payment to secure job",
      points: 40,
      matchedKeywords: [...new Set(jobPaymentMatches)]
    });
  }
  // --------------------------------------------------
  // R3 — Sensitive financial information
  // --------------------------------------------------

  const financialKeywords = [
    "asked to share bank details",
    "asked for bank details",
    "asked to provide bank details",
    "requested bank details",
    "asked to share upi",
    "asked for upi",
    "asked to provide upi",
    "asked to share card details",
    "asked for card details",
    "asked to provide card details",
    "asked for otp",
    "requested otp",
    "share your otp",
    "provide your otp"
  ];

  const financialMatches = allTexts.flatMap(text =>
    financialKeywords.filter(keyword => text.includes(keyword))
  );

  if (financialMatches.length > 0) {
    flags.push({
      id: "R3",
      name: "Sensitive financial information request",
      points: 20,
      matchedKeywords: [...new Set(financialMatches)]
    });
  }

  // --------------------------------------------------
  // --------------------------------------------------
  // R7 — Recruitment scam-related evidence
  // --------------------------------------------------

  const scamKeywords = [
    "job scam",
    "recruitment scam",
    "fraudulent recruitment",
    "job fraud",
    "recruitment fraud",
    "fake job",
    "fake jobs",
    "fake recruiter",
    "fake recruiters",
    "bribes-for-jobs",
    "recruitment misconduct"
  ];

  let scamEvidenceCount = 0;
  const matchedScamKeywords = [];

  const companyName = normalizeText(evidence.query || "");

  for (const text of allTexts) {
    const scamMatches = scamKeywords.filter(keyword =>
      text.includes(keyword)
    );

    const mentionsCompany =
      companyName &&
      text.includes(companyName);

    if (scamMatches.length > 0 && mentionsCompany) {
      scamEvidenceCount += 1;
      matchedScamKeywords.push(...scamMatches);
    }
  }

  // Require evidence from at least two separate results.
  // This makes the signal stronger while avoiding a verdict
  // based on a single article.
  if (scamEvidenceCount >= 2) {
    flags.push({
      id: "R7",
      name: "Recruitment scam-related evidence found",
      points: 15,
      matchedKeywords: [...new Set(matchedScamKeywords)]
    });
  }
  return flags;
}
function detectTrustSignals(evidence) {
  const signals = [];

  const jobs = safeArray(evidence.jobs);
  const searches = safeArray(evidence.searchResults);
  const news = safeArray(evidence.newsResults);

  if (jobs.length > 0) {
    signals.push({
      id: "T2",
      name: "Job listings found",
      points: 10,
      detail: `${jobs.length} job listing(s) found through Google Jobs`
    });
  }

  if (searches.length >= 2) {
    signals.push({
      id: "T3",
      name: "Independent search evidence",
      points: 5,
      detail: `${searches.length} search results found`
    });
  }

  // Stronger trust signal:
  // the job listing should actually match the investigated company.
  const companyName = normalizeText(evidence.query || "");

  if (companyName && jobs.length > 0) {
    const matchingJobs = jobs.filter(job => {
      const jobCompany = normalizeText(job.company || "");

      return (
        jobCompany &&
        jobCompany !== "unknown company" &&
        jobCompany.includes(companyName)
      );
    });

    if (matchingJobs.length > 0) {
      signals.push({
        id: "T4",
        name: "Company-specific job listings found",
        points: 8,
        detail:
          `${matchingJobs.length} job listing(s) match the investigated company`
      });
    }
  }

  // Supporting web footprint only.
  if (companyName && searches.length >= 3) {
    const companyMentions = searches.filter(item => {
      const title = normalizeText(item.title || "");
      const snippet = normalizeText(item.snippet || "");

      return (
        title.includes(companyName) ||
        snippet.includes(companyName)
      );
    });

    if (companyMentions.length >= 3) {
      signals.push({
        id: "T5",
        name: "Strong company web footprint",
        points: 5,
        detail:
          `${companyMentions.length} independent search results mention the investigated company`
      });
    }
  }

  return signals;
}

function checkDataSufficiency(evidence) {
  const jobs = safeArray(evidence.jobs);
  const searches = safeArray(evidence.searchResults);
  const news = safeArray(evidence.newsResults);

  const totalEvidence = jobs.length + searches.length + news.length;

  if (totalEvidence < 2) {
    return {
      sufficient: false,
      reason: "Very little independent evidence was found."
    };
  }

  if (jobs.length === 0 && searches.length < 2) {
    return {
      sufficient: false,
      reason: "Not enough strong independent evidence was found."
    };
  }

  return {
    sufficient: true,
    reason: "Enough independent evidence was collected."
  };
}
function calculateRisk(redFlags, trustSignals, contradictions) {
  const redFlagPoints = redFlags.reduce(
    (total, item) => total + item.points,
    0
  );

  const contradictionPoints = contradictions.reduce(
    (total, item) => total + item.points,
    0
  );

  const trustPoints = trustSignals.reduce(
    (total, item) => total + item.points,
    0
  );

  // Risk evidence should not be cancelled out completely
  // by positive signals.
  const trustAdjustment = Math.min(trustPoints, 10);

  const rawScore =
    redFlagPoints +
    contradictionPoints -
    trustAdjustment;

  return Math.max(0, Math.min(100, rawScore));
}
function detectContradictions(evidence) {
  const searches = safeArray(evidence.searchResults);
  const news = safeArray(evidence.newsResults);

  const companyName = normalizeText(evidence.query || "");

  if (!companyName) {
    return [];
  }

  const sources = [...searches, ...news].map(item => ({
    title: normalizeText(item.title || ""),
    snippet: normalizeText(
      `${item.snippet || ""} ${item.description || ""}`
    ),
    link: item.link || null
  }));

  const scamKeywords = [
    "job scam",
    "recruitment scam",
    "job fraud",
    "recruitment fraud",
    "bribes-for-jobs",
    "recruitment misconduct",
    "fake recruiter",
    "fake recruitment"
  ];

  const denialKeywords = [
    "denies",
    "denied",
    "no scam",
    "not a scam",
    "no evidence",
    "denies involvement",
    "denied involvement",
    "not involved"
  ];

  const mentionsCompany = source => {
    const text = `${source.title} ${source.snippet}`;

    return text.includes(companyName);
  };

  const scamSources = sources.filter(source => {
    const text = `${source.title} ${source.snippet}`;

    return (
      mentionsCompany(source) &&
      scamKeywords.some(keyword => text.includes(keyword))
    );
  });

  const denialSources = sources.filter(source => {
    const text = `${source.title} ${source.snippet}`;

    return (
      mentionsCompany(source) &&
      denialKeywords.some(keyword => text.includes(keyword))
    );
  });

  // A contradiction requires separate pieces of evidence:
  // one reporting a scam-related allegation and another
  // containing a denial or rejection of that allegation.
  const differentSources = scamSources.some(scamSource =>
    denialSources.some(denialSource =>
      scamSource.link &&
      denialSource.link &&
      scamSource.link !== denialSource.link
    )
  );

  if (differentSources) {
    return [
      {
        id: "C1",
        name: "Conflicting recruitment-scam reports",
        points: 8,
        detail:
          "Independent sources contain both recruitment-scam allegations and responses or denials involving the investigated company."
      }
    ];
  }

  return [];
}

function generateVerdict(score, sufficient, redFlags, trustSignals) {
  if (!sufficient) {
    return {
      label: "Not Enough Data",
      emoji: "🔵"
    };
  }

  const hasSeriousPaymentRisk = redFlags.some(
    flag =>
      flag.id === "R1" ||
      flag.id === "R2"
  );

  if (hasSeriousPaymentRisk || score >= 60) {
    return {
      label: "Likely Scam",
      emoji: "🔴"
    };
  }

  const hasRecruitmentScamEvidence = redFlags.some(
    flag => flag.id === "R7"
  );

  if (hasRecruitmentScamEvidence || score >= 15) {
    return {
      label: "Be Careful",
      emoji: "🟡"
    };
  }

  const hasStrongTrustSignal = trustSignals.some(
    signal =>
      signal.id === "T4"
  );

  if (hasStrongTrustSignal) {
    return {
      label: "Looks Legit",
      emoji: "🟢"
    };
  }

  return {
    label: "Not Enough Data",
    emoji: "🔵"
  };
}

function analyzeEvidence(evidence) {
  const redFlags = detectRedFlags(evidence);

  const trustSignals = detectTrustSignals(evidence);

  const contradictions = detectContradictions(evidence);

  const sufficiency = checkDataSufficiency(evidence);

  const score = calculateRisk(
    redFlags,
    trustSignals,
    contradictions
  );

  const verdict = generateVerdict(
    score,
    sufficiency.sufficient,
    redFlags,
    trustSignals
  );

  return {
    score,
    verdict,
    dataSufficiency: sufficiency,
    redFlags,
    trustSignals,
    contradictions,
    summary: {
      totalJobs: safeArray(evidence.jobs).length,
      totalSearchResults: safeArray(evidence.searchResults).length,
      totalNewsResults: safeArray(evidence.newsResults).length
    }
  };
}

module.exports = {
  analyzeEvidence
};