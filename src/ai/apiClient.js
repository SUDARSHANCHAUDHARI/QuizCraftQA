/**
 * Minimal HTTP client for optional AI endpoints.
 * All requests are POST with JSON payloads.
 */

/**
 * Redacts common credential patterns from a string so they are not logged.
 * @param {string} str
 * @returns {string}
 */
export function redactString(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/(api[-_]?key['":\s=]+)\S+/gi, "$1[REDACTED]")
    .replace(/(Authorization:\s*)\S+/gi, "$1[REDACTED]");
}

/**
 * POST JSON to an AI endpoint and return parsed response.
 * @param {{ endpoint: string, endpointName: string, payload: object }} options
 * @returns {Promise<object>}
 */
export async function callAiEndpoint({ endpoint, endpointName, payload }) {
  if (!endpoint) {
    throw new Error(`No endpoint configured for ${endpointName}`);
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    throw new Error(
      `${endpointName}: network request failed — ${networkError?.message || String(networkError)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `${endpointName}: server responded with ${response.status} ${response.statusText}`
    );
  }

  try {
    return await response.json();
  } catch (parseError) {
    throw new Error(`${endpointName}: failed to parse JSON response`);
  }
}
