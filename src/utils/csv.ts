/**
 * Parses raw CSV text into a 2D array of strings.
 * Correctly handles double-quoted fields, escaped quotes (""), and multiline cells.
 */
export function parseCSV(text: string): string[][] {
	const result: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let insideQuote = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const nextChar = text[i + 1];

		if (insideQuote) {
			if (char === '"') {
				if (nextChar === '"') {
					cell += '"';
					i++; // Skip the next quote character
				} else {
					insideQuote = false;
				}
			} else {
				cell += char;
			}
		} else {
			if (char === '"') {
				insideQuote = true;
			} else if (char === ",") {
				row.push(cell);
				cell = "";
			} else if (char === "\n" || char === "\r") {
				row.push(cell);
				cell = "";
				result.push(row);
				row = [];
				if (char === "\r" && nextChar === "\n") {
					i++; // Skip the newline character
				}
			} else {
				cell += char;
			}
		}
	}

	// Add final cell and row if not terminated by a newline
	if (cell !== "" || row.length > 0) {
		row.push(cell);
		result.push(row);
	}

	// Filter out completely empty trailing rows that spreadsheets often output
	return result.filter((r) => r.some((val) => val.trim() !== ""));
}
