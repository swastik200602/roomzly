import crypto from "node:crypto";
import { badRequest, unauthorized } from "@/lib/app-error.js";
import { env } from "@/config/env.js";

type GoogleJwtHeader = {
  alg: string;
  kid: string;
  typ?: string;
};

type GoogleJwtPayload = {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
  exp: number;
};

type GoogleJwk = crypto.JsonWebKey & {
  kid: string;
  alg: string;
};

let jwksCache: { keys: GoogleJwk[]; expiresAt: number } | undefined;

function decodeBase64Url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function parseJson<T>(input: string): T {
  return JSON.parse(decodeBase64Url(input).toString("utf8")) as T;
}

async function getGoogleJwks(): Promise<GoogleJwk[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;

  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw unauthorized("Could not verify Google credential");
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] ?? 3600);
  const body = (await response.json()) as { keys?: GoogleJwk[] };
  if (!Array.isArray(body.keys)) throw unauthorized("Could not verify Google credential");

  jwksCache = { keys: body.keys, expiresAt: Date.now() + maxAge * 1000 };
  return body.keys;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleJwtPayload> {
  if (!env.GOOGLE_CLIENT_ID) throw badRequest("Google authentication is not configured");

  const [encodedHeader, encodedPayload, encodedSignature] = credential.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) throw unauthorized("Invalid Google credential");

  const header = parseJson<GoogleJwtHeader>(encodedHeader);
  if (header.alg !== "RS256" || !header.kid) throw unauthorized("Invalid Google credential");

  const key = (await getGoogleJwks()).find((item) => item.kid === header.kid);
  if (!key) throw unauthorized("Invalid Google credential");

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const publicKey = crypto.createPublicKey({ key, format: "jwk" });
  const signatureValid = verifier.verify(publicKey, decodeBase64Url(encodedSignature));
  if (!signatureValid) throw unauthorized("Invalid Google credential");

  const payload = parseJson<GoogleJwtPayload>(encodedPayload);
  const validIssuer = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";
  if (!validIssuer || payload.aud !== env.GOOGLE_CLIENT_ID || payload.exp * 1000 <= Date.now()) {
    throw unauthorized("Invalid Google credential");
  }
  if (!payload.email || !payload.email_verified) throw unauthorized("Google email is not verified");

  return payload;
}
