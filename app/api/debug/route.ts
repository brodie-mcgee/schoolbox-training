import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SHARED_SECRET = process.env.SCHOOLBOX_SHARED_SECRET || "placeholder-secret";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const time = searchParams.get("time");
  const id = searchParams.get("id");
  const user = searchParams.get("user");

  const timestamp = time ? parseInt(time, 10) : 0;
  const now = Math.floor(Date.now() / 1000);
  const concatenated = SHARED_SECRET + time + id;

  const expected = crypto
    .createHash("sha1")
    .update(concatenated)
    .digest("hex");

  return NextResponse.json({
    received: { key, time, id, user },
    debug: {
      secretPrefix: SHARED_SECRET.substring(0, 4),
      secretLength: SHARED_SECRET.length,
      concatenatedLength: concatenated.length,
      expectedSignature: expected,
      providedSignature: key,
      signaturesMatch: key === expected,
      timestampProvided: timestamp,
      timestampNow: now,
      timestampDiff: Math.abs(now - timestamp),
      timestampValid: Math.abs(now - timestamp) <= 300,
    },
  });
}
