import { META_PIXEL_IDS } from "./meta-config";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey() {
  const secret = process.env["META_TOKEN_ENCRYPTION_KEY"];
  if (!secret) throw new Error("META_TOKEN_ENCRYPTION_KEY não configurada");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptMetaToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    encoder.encode(token),
  );
  return {
    tokenCiphertext: bytesToBase64(new Uint8Array(ciphertext)),
    tokenIv: bytesToBase64(iv),
  };
}

export async function decryptMetaToken(tokenCiphertext: string, tokenIv: string) {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(tokenIv) },
    await encryptionKey(),
    base64ToBytes(tokenCiphertext),
  );
  return decoder.decode(plaintext);
}

export function isBuiltInMetaPixel(pixelId: string) {
  return META_PIXEL_IDS.some((current) => current === pixelId);
}