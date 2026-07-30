/**
 * Parse @mentions from a body of text. Returns a deduplicated list of
 * mentioned display names (the substring after `@`, without the `@`).
 *
 * Examples:
 *   "Hey @alice, can you take a look?" -> ["alice"]
 *   "@bob @carol, ping me" -> ["bob", "carol"]
 *   "Not an email@bob.com mention" -> []
 */
export function parseMentions(text: string): string[] {
  if (!text) return [];
  const re = /(?:^|[\s,;.!?\(\[])@([a-zA-Z0-9_.-]{2,30})/g;
  const out = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const name = match[1].replace(/\.+$/, "").toLowerCase();
    if (name.length >= 2) out.add(name);
  }
  return Array.from(out);
}

/**
 * Replace @mentions in `text` with HTML-safe <a> tags pointing to
 * the user profile. Email addresses are left untouched (the regex
 * already excludes them).
 *
 * NOTE: when we render replies we still display the raw text with
 * `whitespace-pre-wrap`. Mentions are highlighted client-side via a
 * separate component to avoid any XSS surface.
 */
export function highlightMentions(
  text: string,
  knownUsernames: Set<string>,
): Array<{ type: "text" | "mention"; value: string }> {
  const out: Array<{ type: "text" | "mention"; value: string }> = [];
  const re = /(?:^|[\s,;.!?\(\[])@([a-zA-Z0-9_.-]{2,30})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const matchStart = match.index + match[0].indexOf("@");
    const username = match[1].replace(/\.+$/, "").toLowerCase();
    if (matchStart > lastIndex) {
      out.push({ type: "text", value: text.slice(lastIndex, matchStart) });
    }
    if (knownUsernames.has(username)) {
      out.push({ type: "mention", value: username });
    } else {
      // Unknown username — render the literal text
      out.push({ type: "text", value: match[0].slice(match[0].indexOf("@")) });
    }
    lastIndex = matchStart + username.length + 1;
  }
  if (lastIndex < text.length) {
    out.push({ type: "text", value: text.slice(lastIndex) });
  }
  return out;
}
