import type { SchoolboxUser } from "./auth";

// Use placeholder values during build, real values at runtime
const SCHOOLBOX_BASE_URL = process.env.SCHOOLBOX_BASE_URL || "https://placeholder.schoolbox.com";
const SCHOOLBOX_API_TOKEN = process.env.SCHOOLBOX_API_TOKEN || "placeholder-token";

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
