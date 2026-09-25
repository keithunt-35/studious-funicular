function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractLocation(text) {
  const locationMatch = text.match(/\b(?:at|in|near)\s+([^.!?;]+)/i);
  return locationMatch ? normalizeWhitespace(locationMatch[1]) : null;
}

function removeSeverityKeyword(text) {
  return normalizeWhitespace(
    text.replace(/\b(?:critical|high|medium|low)\b[:,-]?/i, "")
  );
}

function createTitle(text, severity, location) {
  const summary = removeSeverityKeyword(text).replace(/[.!?]+$/, "");
  const titleText = summary || (location ? `Incident at ${location}` : "SMS incident report");
  const title = `${severity[0].toUpperCase()}${severity.slice(1)}: ${titleText}`;
  return title.length > 100 ? `${title.slice(0, 97)}...` : title;
}

function parseInboundSms(rawText) {
  const description = normalizeWhitespace(rawText);
  const severityMatch = description.match(/\b(critical|high|medium|low)\b/i);
  const severity = severityMatch ? severityMatch[1].toLowerCase() : "medium";
  const location = extractLocation(description);

  return {
    title: createTitle(description, severity, location),
    description,
    severity,
    location,
  };
}

export { parseInboundSms };