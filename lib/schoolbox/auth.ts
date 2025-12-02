import crypto from "crypto";

// Use placeholder values during build, real values at runtime
const SHARED_SECRET = process.env.SCHOOLBOX_SHARED_SECRET || "placeholder-secret";

const TIME_TOLERANCE_SECONDS = 300; // ±5 minutes

/**
 * Verifies the Schoolbox remote service signature
 * Format: key=SHA1(secret+time+id)&time=timestamp&id=externalId&user=username
 *
 * @param key - The SHA1 hash provided by Schoolbox
 * @param time - Unix timestamp when the request was generated
 * @param id - External ID (staff ID) from Schoolbox
 * @returns true if signature is valid and within time tolerance
 */
export function verifySchoolboxSignature(
  key: string,
  time: string,
  id: string
): boolean {
  const timestamp = parseInt(time, 10);
  const now = Math.floor(Date.now() / 1000);

  // Check timestamp is within ±5 minutes
  if (Math.abs(now - timestamp) > TIME_TOLERANCE_SECONDS) {
    console.log("[verifySchoolboxSignature] Timestamp out of tolerance:", {
      provided: timestamp,
      now,
      diff: Math.abs(now - timestamp),
      tolerance: TIME_TOLERANCE_SECONDS,
    });
    return false;
  }

  // Compute expected SHA1 hash: SHA1(secret + time + id)
  const expected = crypto
    .createHash("sha1")
    .update(SHARED_SECRET + time + id)
    .digest("hex");

  const isValid = key === expected;

  if (!isValid) {
    console.log("[verifySchoolboxSignature] Signature mismatch:", {
      provided: key,
      expected,
    });
  }

  return isValid;
}

/**
 * Determines if user is staff based on Schoolbox user data
 * Uses the role.type field from the Schoolbox API
 */
export function isStaff(userData: SchoolboxUser): boolean {
  console.log("[isStaff] Checking user role:", {
    userId: userData.id,
    username: userData.username,
    roleType: userData.role?.type,
    roleName: userData.role?.name,
  });

  // The Schoolbox API returns role.type as "staff", "student", "parent", or "guest"
  const isStaffUser = userData.role?.type === "staff";

  console.log("[isStaff] Result:", isStaffUser);

  return isStaffUser;
}

/**
 * Schoolbox user data structure from API
 */
export interface SchoolboxUser {
  id: number;
  externalId?: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  role?: {
    type: "staff" | "student" | "parent" | "guest";
    name: string;
  };
  yearLevel?: {
    name: string;
  };
  schoolHouse?: {
    name: string;
  };
  _links?: {
    avatar?: string;
    profile?: string;
  };
}
