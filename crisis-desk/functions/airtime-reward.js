function isCriticalResolution(before, after) {
  return before.status !== "resolved"
    && after.status === "resolved"
    && after.severity === "critical";
}

function parseRewardAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export { isCriticalResolution, parseRewardAmount };