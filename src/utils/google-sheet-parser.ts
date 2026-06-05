/**
 * Parses the spreadsheet ID from a Google Sheets URL or returns the input if it's already an ID.
 * @param urlOrId The Google Sheets URL or spreadsheet ID
 * @returns The spreadsheet ID or null if not found
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
	if (!urlOrId) return null;

	// If it's already a likely ID (no slashes, long enough)
	if (!urlOrId.includes("/") && urlOrId.length > 20) {
		return urlOrId.trim();
	}

	// Regex to match the ID in various URL formats
	// Matches /spreadsheets/d/[ID]/ or /spreadsheets/d/[ID]
	const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
	const match = urlOrId.match(regex);

	return match?.[1] ?? null;
}
