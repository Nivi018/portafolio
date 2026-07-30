import { Secret, TOTP } from "otpauth";
import qrcode from "qrcode";

const ISSUER = "Tickets App";

/**
 * Generate a TOTP secret for a user. The user scans the QR with an
 * authenticator app (1Password, Authy, Google Authenticator, etc.) and
 * confirms with a 6-digit code to enable 2FA.
 */
export function generateTotpSecret(userEmail: string): {
  secret: string;
  uri: string;
  qrCodeDataUrl: Promise<string>;
} {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: ISSUER,
    label: userEmail,
    secret,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  const uri = totp.toString();
  const qrCodeDataUrl = qrcode.toDataURL(uri, {
    margin: 1,
    width: 240,
  });
  return {
    secret: secret.base32,
    uri,
    qrCodeDataUrl,
  };
}

/**
 * Verify a 6-digit TOTP code against a stored base32 secret.
 * Allows a window of ±1 step (30s) to account for clock drift.
 */
export function verifyTotp(secretBase32: string, code: string): boolean {
  if (!/^\d{6}$/.test(code.trim())) return false;
  const totp = new TOTP({
    issuer: ISSUER,
    secret: Secret.fromBase32(secretBase32),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  // 30s window on each side = 90s total tolerance
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}
