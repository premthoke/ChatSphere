/**
 * src/utils/helpers.js — Shared utility functions
 */

/**
 * Format a timestamp to a human-readable time string.
 * @param {string|Date} date
 * @returns {string} e.g. "3:45 PM"
 */
export const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Format a timestamp to a date label.
 * Returns "Today", "Yesterday", or a full date.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateLabel = (date) => {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
};

/**
 * Get the initial letter(s) for an avatar fallback.
 * @param {string} name
 * @returns {string} uppercase initial
 */
export const getInitial = (name = "") => (name[0] || "?").toUpperCase();

/**
 * Group an array of messages by date.
 * @param {Array} messages
 * @returns {Array<{ label: string, messages: Array }>}
 */
export const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentLabel = null;

  messages.forEach((msg) => {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentLabel) {
      groups.push({ label, messages: [msg] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });

  return groups;
};

/**
 * Truncate a string to n characters.
 * @param {string} str
 * @param {number} n
 * @returns {string}
 */
export const truncate = (str = "", n = 35) =>
  str.length > n ? str.slice(0, n) + "…" : str;
