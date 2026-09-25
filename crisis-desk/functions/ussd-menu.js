const MENU_MESSAGE = "CON Crisis Desk\n1. Report Emergency\n2. My Assigned Tasks\n3. Help";

function getUssdResponse(rawText) {
  const text = rawText.trim();

  if (!text) {
    return { action: "menu", message: MENU_MESSAGE };
  }

  if (text === "1") {
    return { action: "menu", message: "CON Select severity\n1. Critical\n2. High\n3. Medium\n4. Low" };
  }

  if (/^1\*[1-4]$/.test(text)) {
    return { action: "menu", message: "CON Briefly describe the emergency:" };
  }

  if (/^1\*[1-4]\*.+/.test(text)) {
    const [, severityChoice, description] = text.split("*");
    const severities = ["critical", "high", "medium", "low"];
    return {
      action: "create_incident",
      severity: severities[Number(severityChoice) - 1],
      description: description.trim().slice(0, 500),
    };
  }

  if (text === "2") {
    return { action: "tasks" };
  }

  if (text === "3") {
    return { action: "help", message: "END Reply with a number. Report Emergency collects severity and a short description." };
  }

  return { action: "invalid", message: "END Invalid option. Please dial again." };
}

export { getUssdResponse };