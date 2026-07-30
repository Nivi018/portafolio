import { describe, expect, it } from "vitest";
import { createRatingSchema } from "./rating";

describe("createRatingSchema", () => {
  it("accepts a rating without comment", () => {
    const result = createRatingSchema.safeParse({
      score: "5",
      comment: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.score).toBe(5);
    }
  });

  it("accepts a rating with comment", () => {
    const result = createRatingSchema.safeParse({
      score: "4",
      comment: "  Great service!  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBe("Great service!");
    }
  });

  it("rejects scores below 1", () => {
    expect(
      createRatingSchema.safeParse({ score: "0", comment: "" }).success,
    ).toBe(false);
  });

  it("rejects scores above 5", () => {
    expect(
      createRatingSchema.safeParse({ score: "6", comment: "" }).success,
    ).toBe(false);
  });

  it("rejects non-numeric scores", () => {
    expect(
      createRatingSchema.safeParse({ score: "abc", comment: "" }).success,
    ).toBe(false);
  });

  it("rejects overly long comments", () => {
    expect(
      createRatingSchema.safeParse({
        score: "5",
        comment: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });
});
