import type { SchoolboxUser } from "./auth";

// Use placeholder values during build, real values at runtime
const SCHOOLBOX_BASE_URL = process.env.SCHOOLBOX_BASE_URL || "https://placeholder.schoolbox.com";
const SCHOOLBOX_API_TOKEN = process.env.SCHOOLBOX_API_TOKEN || "placeholder-token";

export interface SchoolboxStaffMember {
  id: number;
  externalId: string | null;
  username: string;
  email: string | null;
  title: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  role?: {
    type: string;
    name: string;
  };
}

/**
 * Fetches all staff members from Schoolbox API
 * Uses pagination to get all staff (max 500 per request)
 *
 * @returns Array of staff members
 */
export async function getAllSchoolboxStaff(): Promise<SchoolboxStaffMember[]> {
  console.log("[getAllSchoolboxStaff] Fetching all staff from Schoolbox...");

  const allStaff: SchoolboxStaffMember[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const maxPages = 20; // Safety limit

  do {
    // Build filter for staff role
    // Schoolbox API uses nested filter object: { "role": { "type": "staff" } }
    const filter = { role: { type: "staff" } };
    const filterJson = JSON.stringify(filter);
    const filterEncoded = encodeURIComponent(filterJson);

    // Build URL with pagination
    let url = `${SCHOOLBOX_BASE_URL}/api/user?filter=${filterEncoded}&limit=100`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }

    console.log(`[getAllSchoolboxStaff] Fetching page ${pageCount + 1}...`);
    console.log(`[getAllSchoolboxStaff] Filter: ${filterJson}`);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SCHOOLBOX_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[getAllSchoolboxStaff] API error:", response.status, errorText.substring(0, 200));
        throw new Error(`Schoolbox API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        // Map to our expected format
        // Note: API may return additional fields not in our type
        const staffPage = result.data
          .filter((user: Record<string, unknown>) => user && user.id && user.username)
          .map((user: Record<string, unknown>) => ({
            id: user.id as number,
            externalId: user.externalId?.toString() || null,
            username: user.username as string,
            email: (user.email as string) || null,
            title: (user.title as string) || null,
            firstName: (user.firstName as string) || "",
            lastName: (user.lastName as string) || "",
            fullName: (user.fullName as string) || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            role: user.role as { type: string; name: string } | undefined,
          }));

        allStaff.push(...staffPage);
        console.log(`[getAllSchoolboxStaff] Got ${staffPage.length} staff, total: ${allStaff.length}`);
      } else {
        console.log(`[getAllSchoolboxStaff] No data array in response`);
      }

      // Get next cursor for pagination
      cursor = result.meta?.cursor?.next || null;
      pageCount++;

    } catch (error) {
      console.error("[getAllSchoolboxStaff] Error fetching staff:", error);
      throw error;
    }

  } while (cursor && pageCount < maxPages);

  console.log(`[getAllSchoolboxStaff] Completed. Total staff: ${allStaff.length}`);
  return allStaff;
}

/**
 * Fetches user details from Schoolbox API by internal user ID
 * Uses the direct GET /api/user/{id} endpoint
 */
export async function getSchoolboxUserById(userId: number | string): Promise<SchoolboxUser> {
  console.log("[getSchoolboxUserById] Fetching user by ID:", userId);

  const url = `${SCHOOLBOX_BASE_URL}/api/user/${userId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SCHOOLBOX_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[getSchoolboxUserById] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[getSchoolboxUserById] Failed:", errorText.substring(0, 200));
      throw new Error(`User not found with ID: ${userId}`);
    }

    const userData = await response.json();
    console.log("[getSchoolboxUserById] Successfully found user:", {
      id: userData.id,
      externalId: userData.externalId,
      username: userData.username,
      roleType: userData.role?.type,
    });

    return userData;
  } catch (error) {
    console.error("[getSchoolboxUserById] Error:", error);
    throw error;
  }
}

/**
 * Fetches user details from Schoolbox API using multiple search strategies
 * Tries: direct ID lookup, then search by externalId, then search by username
 *
 * @param externalId - The external ID (staff ID) from Schoolbox
 * @param username - The username from Schoolbox
 * @returns Schoolbox user data
 */
export async function getSchoolboxUser(
  externalId: string,
  username?: string
): Promise<SchoolboxUser> {
  console.log("[getSchoolboxUser] Searching for user:", {
    externalId,
    username,
    baseUrl: SCHOOLBOX_BASE_URL,
  });

  // First try: treat externalId as a Schoolbox internal user ID
  // This is common for some auth scenarios where the id param contains the user ID
  try {
    const userData = await getSchoolboxUserById(externalId);
    console.log("[getSchoolboxUser] Found via direct ID lookup");
    return userData;
  } catch (error) {
    console.log("[getSchoolboxUser] Direct ID lookup failed, trying search methods...");
  }

  // Second try: search by externalId or username using filters
  const searchMethods = [
    { param: "externalId", value: externalId },
    { param: "username", value: username },
    { param: "username", value: externalId }, // Try externalId as username too
  ];

  for (const method of searchMethods) {
    if (!method.value) continue; // Skip if value is not provided

    try {
      // Build filter object: { "externalId": "12345" } or { "username": "jsmith" }
      const filterObject = { [method.param]: method.value };
      const filterJson = JSON.stringify(filterObject);
      const filterEncoded = encodeURIComponent(filterJson);

      // Build search URL with JSON-encoded filter parameter
      const url = `${SCHOOLBOX_BASE_URL}/api/user?filter=${filterEncoded}`;

      console.log("[getSchoolboxUser] Trying search by", method.param, ":", method.value);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SCHOOLBOX_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[getSchoolboxUser] Response status:", response.status);

      if (!response.ok) {
        console.log("[getSchoolboxUser] Failed with status", response.status);
        continue; // Try next search method
      }

      const result = await response.json();
      console.log("[getSchoolboxUser] Search result:", {
        count: result.data?.length || 0,
        searchedBy: method.param,
      });

      // Check if we got results
      if (result.data && result.data.length > 0) {
        const userData = result.data[0]; // Get first match
        console.log("[getSchoolboxUser] Successfully found user:", {
          id: userData.id,
          externalId: userData.externalId,
          username: userData.username,
          roleType: userData.role?.type,
        });
        return userData;
      }

      console.log("[getSchoolboxUser] No users found with", method.param, "=", method.value);
    } catch (error) {
      console.log("[getSchoolboxUser] Error searching by", method.param, ":", error);
    }
  }

  // If all search methods failed
  console.error("[getSchoolboxUser] Could not find user with externalId or username");
  throw new Error(`User not found with externalId: ${externalId} or username: ${username}`);
}
