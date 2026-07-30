import { describe, expect, it } from "vitest";
import { highlightMentions, parseMentions } from "./mentions";

describe("parseMentions", () => {
  it("extracts a single mention", () => {
    expect(parseMentions("Hey @alice, take a look")).toEqual(["alice"]);
  });

  it("extracts multiple mentions", () => {
    expect(parseMentions("@bob @carol ping me")).toEqual(["bob", "carol"]);
  });

  it("deduplicates", () => {
    expect(parseMentions("@alice @alice @bob")).toEqual(["alice", "bob"]);
  });

  it("lowercases usernames", () => {
    expect(parseMentions("@Alice")).toEqual(["alice"]);
  });

  it("ignores email addresses", () => {
    expect(parseMentions("Email me at user@example.com")).toEqual([]);
  });

  it("ignores mention-like but invalid patterns", () => {
    expect(parseMentions("a@b is not a mention")).toEqual([]); // 'a' is too short (< 2)
    expect(parseMentions("@ ")).toEqual([]);
  });

  it("requires the @ to be at the start of a word", () => {
    expect(parseMentions("text@notamention")).toEqual([]);
  });

  it("allows dots, dashes and underscores", () => {
    expect(parseMentions("@alice.smith and @bob_jones and @carol-99")).toEqual([
      "alice.smith",
      "bob_jones",
      "carol-99",
    ]);
  });

  it("handles punctuation around mentions", () => {
    expect(parseMentions("(see @alice), or @bob.")).toEqual(["alice", "bob"]);
  });
});

describe("highlightMentions", () => {
  it("marks known mentions", () => {
    const known = new Set(["alice", "bob"]);
    const out = highlightMentions("hi @alice and @bob", known);
    expect(out).toEqual([
      { type: "text", value: "hi " },
      { type: "mention", value: "alice" },
      { type: "text", value: " and " },
      { type: "mention", value: "bob" },
    ]);
  });

  it("leaves unknown mentions as text", () => {
    const known = new Set(["alice"]);
    const out = highlightMentions("hi @alice and @stranger", known);
    // Unknown mentions stay as plain text; they may be split into
    // multiple text segments but the rendered output is identical.
    expect(out).toEqual([
      { type: "text", value: "hi " },
      { type: "mention", value: "alice" },
      { type: "text", value: " and " },
      { type: "text", value: "@stranger" },
    ]);
  });
});
