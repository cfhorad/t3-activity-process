/**
 * Parses a time string into total minutes from midnight.
 * Supports "上午/下午", "AM/PM" markers at the beginning or end.
 * Treats 12:xx as 0:xx for consistency with 12-hour clock cycles when no marker is present.
 */
function parseTime(timeStr: string): number | null {
	const match = timeStr.match(
		/^\s*(上午|下午|AM|PM)?\s*(\d{1,2}):(\d{1,2})\s*(上午|下午|AM|PM)?\s*$/i,
	);
	if (!match) return null;

	const marker = (match[1] ?? match[4] ?? "").toUpperCase();
	let h = parseInt(match[2] ?? "0", 10);
	const m = parseInt(match[3] ?? "0", 10);

	// Handle 12-hour clock: 12 AM is 0, 12 PM is 12.
	// If no marker is present, we assume 12:xx is the start of the cycle (0:xx)
	// to avoid 13-hour durations in common 12-hour entries (12:00 to 1:00).
	if (h === 12) {
		h = 0;
	}

	if (marker === "下午" || marker === "PM") {
		h += 12;
	}

	return h * 60 + m;
}

/**
 * Calculates the duration between two time strings.
 * Returns the duration in "h:mm" format (no leading zero on hours).
 */
export function calculateDuration(start?: string, end?: string): string | null {
	if (!start || !end) return null;

	const startTotalMinutes = parseTime(start);
	const endTotalMinutes = parseTime(end);

	if (startTotalMinutes === null || endTotalMinutes === null) return null;

	let diff = endTotalMinutes - startTotalMinutes;

	// Handle case where end time is on the next day
	if (diff < 0) {
		diff += 24 * 60;
	}

	const h = Math.floor(diff / 60);
	const m = diff % 60;

	// Use h:mm format (no leading zero for hour)
	return `${h}:${String(m).padStart(2, "0")}`;
}

/**
 * Formats a time string for display by removing leading zeros from the hour part.
 * e.g., "01:00" -> "1:00", "下午 02:30" -> "下午 2:30"
 */
export function formatTimeDisplay(timeStr?: string): string {
	if (!timeStr) return "-";
	return timeStr.replace(/(^|[\s上午下午AMP]+)0(\d:)/i, "$1$2");
}
