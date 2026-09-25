function isFeatureEnabled(value) {
  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function isInternationalPhoneNumber(value) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export { isFeatureEnabled, isInternationalPhoneNumber };