import { describe, it, expect } from "vitest";
import {
  toWalletErrorMessage,
  shortenPublicKey,
  formatNetwork,
  isExpectedNetwork,
  SUPPORTED_WALLETS,
  FreighterNotInstalledError,
  STELLAR_NETWORK,
  STELLAR_NETWORK_ID,
} from "./wallet";

describe("STELLAR_NETWORK", () => {
  it("defaults to TESTNET", () => {
    expect(STELLAR_NETWORK).toBe("TESTNET");
  });

  it("STELLAR_NETWORK_ID matches TESTNET", () => {
    expect(STELLAR_NETWORK_ID).toContain("Test SDF Network");
  });
});

describe("SUPPORTED_WALLETS", () => {
  it("contains freighter", () => {
    expect(SUPPORTED_WALLETS.find((w) => w.id === "freighter")).toBeDefined();
  });

  it("each entry has required fields", () => {
    for (const w of SUPPORTED_WALLETS) {
      expect(w.id).toBeTruthy();
      expect(w.name).toBeTruthy();
      expect(w.badge).toBeTruthy();
      expect(w.description).toBeTruthy();
    }
  });
});

describe("FreighterNotInstalledError", () => {
  it("is an instance of Error", () => {
    const err = new FreighterNotInstalledError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("FreighterNotInstalledError");
    expect(err.message).toContain("Freighter");
  });
});

describe("toWalletErrorMessage", () => {
  it("returns specialized message for FreighterNotInstalledError", () => {
    const err = new FreighterNotInstalledError();
    expect(toWalletErrorMessage(err)).toBe(err.message);
  });

  it("returns original message for standard Error", () => {
    const err = new Error("Something broke");
    expect(toWalletErrorMessage(err)).toBe("Something broke");
  });

  it("maps rejection-like strings to friendly message", () => {
    expect(toWalletErrorMessage("user denied")).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("returns non-rejection strings unchanged", () => {
    expect(toWalletErrorMessage("network timeout")).toBe("network timeout");
  });

  it("returns fallback for unknown types", () => {
    expect(toWalletErrorMessage(null)).toBe("Wallet connection failed. Please try again.");
    expect(toWalletErrorMessage(undefined)).toBe("Wallet connection failed. Please try again.");
    expect(toWalletErrorMessage(42)).toBe("Wallet connection failed. Please try again.");
  });

  it("maps user-rejection patterns to friendly message", () => {
    const rejectionMessages = [
      "Request rejected",
      "User declined",
      "Access denied by user",
      "Connection canceled",
      "User cancelled the request",
      "Popup closed by user",
      "Window closed",
    ];

    for (const msg of rejectionMessages) {
      expect(toWalletErrorMessage(new Error(msg))).toBe(
        "You rejected the connection request. Try again when ready."
      );
    }
  });

  it("handles user rejection with /rejected/i pattern", () => {
    expect(toWalletErrorMessage(new Error("Transaction rejected"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /declined/i pattern", () => {
    expect(toWalletErrorMessage(new Error("User declined the request"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /denied/i pattern", () => {
    expect(toWalletErrorMessage(new Error("Access denied by user"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /canceled/i pattern", () => {
    expect(toWalletErrorMessage(new Error("Connection canceled"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /cancelled/i pattern", () => {
    expect(toWalletErrorMessage(new Error("User cancelled the request"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /closed/i pattern", () => {
    expect(toWalletErrorMessage(new Error("Popup closed by user"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /window.*closed/i pattern", () => {
    expect(toWalletErrorMessage(new Error("Window closed"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /user.*denied/i pattern", () => {
    expect(toWalletErrorMessage(new Error("User denied permission"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });

  it("handles user rejection with /user.*abort/i pattern", () => {
    expect(toWalletErrorMessage(new Error("User aborted the operation"))).toBe(
      "You rejected the connection request. Try again when ready."
    );
  });
});

describe("shortenPublicKey", () => {
  it("shortens a long key", () => {
    const key = "GAAAAAAA" + "A".repeat(50);
    const short = shortenPublicKey(key);
    expect(short).toContain("...");
    expect(short.startsWith(key.slice(0, 7))).toBe(true);
    expect(short.endsWith(key.slice(-7))).toBe(true);
  });

  it("returns short keys unchanged", () => {
    const short = "GCXYZ";
    expect(shortenPublicKey(short)).toBe(short);
  });

  it("returns key exactly 14 chars unchanged", () => {
    const key = "GCXYZ123456789";
    expect(shortenPublicKey(key)).toBe(key);
  });
});

describe("formatNetwork", () => {
  it("maps mainnet passphrase to 'Mainnet'", () => {
    expect(formatNetwork("Public Global Stellar Network ; September 2015")).toBe("Mainnet");
  });

  it("maps 'mainnet' to 'Mainnet'", () => {
    expect(formatNetwork("mainnet")).toBe("Mainnet");
  });

  it("maps testnet passphrase to 'Testnet'", () => {
    expect(formatNetwork("Test SDF Network ; September 2015")).toBe("Testnet");
  });

  it("maps 'testnet' to 'Testnet'", () => {
    expect(formatNetwork("testnet")).toBe("Testnet");
  });

  it("maps 'stellar testnet' to 'Testnet'", () => {
    expect(formatNetwork("stellar testnet")).toBe("Testnet");
  });

  it("returns original for unknown networks", () => {
    expect(formatNetwork("custom-network")).toBe("custom-network");
  });

  it("maps 'Public' (uppercase) to 'Mainnet'", () => {
    expect(formatNetwork("Public")).toBe("Mainnet");
  });

  it("maps 'TESTNET' (uppercase) to 'Testnet'", () => {
    expect(formatNetwork("TESTNET")).toBe("Testnet");
  });
});

describe("isExpectedNetwork", () => {
  it("returns true when session matches expected network (default TESTNET)", () => {
    expect(isExpectedNetwork("Test SDF Network ; September 2015")).toBe(true);
    expect(isExpectedNetwork("testnet")).toBe(true);
  });

  it("returns false when session does not match expected network", () => {
    expect(isExpectedNetwork("Public Global Stellar Network ; September 2015")).toBe(false);
    expect(isExpectedNetwork("mainnet")).toBe(false);
  });

  it("returns false when session is mainnet but env is testnet", () => {
    expect(isExpectedNetwork("mainnet")).toBe(false);
  });

  it("returns true when session is testnet and env is testnet", () => {
    expect(isExpectedNetwork("Test SDF Network ; September 2015")).toBe(true);
  });
});