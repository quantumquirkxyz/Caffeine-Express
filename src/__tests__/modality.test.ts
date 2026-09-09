import { describe, it, expect } from "vitest";
import { resolveModality, Modality } from "../domain/modality.js";

describe("Modality", () => {
  it("resolves canonical names directly", () => {
    expect(resolveModality("MRI")).toBe("MRI");
    expect(resolveModality("CT")).toBe("CT");
    expect(resolveModality("Ultrasound")).toBe("Ultrasound");
  });

  it("resolves aliases case-insensitively", () => {
    expect(resolveModality("mri")).toBe("MRI");
    expect(resolveModality("MR")).toBe("MRI");
    expect(resolveModality("ct scanner")).toBe("CT");
    expect(resolveModality("cat scan")).toBe("CT");
    expect(resolveModality("us")).toBe("Ultrasound");
    expect(resolveModality("x-ray")).toBe("X-ray");
    expect(resolveModality("mammo")).toBe("Mammography");
  });

  it("returns Other for unknown modalities", () => {
    expect(resolveModality("banana")).toBe("Other");
    expect(resolveModality("")).toBe("Other");
  });

  it("Modality enum accepts all canonical values", () => {
    const result = Modality.safeParse("MRI");
    expect(result.success).toBe(true);
  });

  it("Modality enum rejects non-canonical values", () => {
    const result = Modality.safeParse("banana");
    expect(result.success).toBe(false);
  });
});
