import { describe, it, expect, beforeEach } from "vitest";
import { encryptSecret, decryptSecret } from "../crypto";

describe("crypto", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "12345678901234567890123456789012"; // 32 bytes
  });

  it("should encrypt and decrypt a secret", () => {
    const plain = "my-super-secret-key";
    const encrypted = encryptSecret(plain);
    expect(encrypted).not.toEqual(plain);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toEqual(plain);
  });
});
