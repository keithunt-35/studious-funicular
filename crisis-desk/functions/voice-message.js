function buildCriticalIncidentMessage(incident) {
  const location = incident.location ? ` at ${incident.location}` : "";
  const description = String(incident.description ?? "A critical incident has been reported").trim();

  return `Attention! A critical ${incident.category ?? "incident"} has been reported${location}. ${description}. Please check your command center immediately.`;
}

export { buildCriticalIncidentMessage };