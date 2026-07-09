import { unauthenticated } from "../shopify.server";

// A server-side logger helper to trace API behavior
const logDebug = async (message) => {
  try {
    const fs = await import("node:fs");
    fs.default.appendFileSync("reviews_api_debug.log", `${new Date().toISOString()} - ${message}\n`);
  } catch (e) {
    console.error("Log error:", e);
  }
};

// CORS helper to append headers
const corsResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  });
};

// Handle CORS preflight request (OPTIONS)
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return corsResponse({}, 200);
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");

  await logDebug(`GET REVIEWS - Product: ${productId}, Shop: ${shop}`);

  if (!productId || !shop) {
    return corsResponse({ error: "Missing productId or shop parameter" }, 400);
  }

  try {
    // 1. Get the unauthenticated admin GraphQL client for the shop
    const { admin } = await unauthenticated.admin(shop);

    // 2. Query the product's reviews_app.reviews_list metafield
    const gid = productId.startsWith("gid://") ? productId : `gid://shopify/Product/${productId}`;
    const response = await admin.graphql(
      `#graphql
      query getProductMetafield($id: ID!) {
        product(id: $id) {
          metafield(namespace: "reviews_app", key: "reviews_list") {
            value
          }
        }
      }`,
      {
        variables: { id: gid }
      }
    );

    const responseJson = await response.json();
    const metafieldValue = responseJson.data?.product?.metafield?.value;

    let reviews = [];
    if (metafieldValue) {
      try {
        reviews = JSON.parse(metafieldValue);
      } catch (parseError) {
        await logDebug(`PARSING ERROR - Invalid JSON value: ${metafieldValue}`);
      }
    }

    // 3. Compute statistics
    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => {
        const rating = parseInt(r.rating, 10) || 5;
        ratingBreakdown[rating] = (ratingBreakdown[rating] || 0) + 1;
        return acc + rating;
      }, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    // Convert count breakdown to percentages
    const ratingPercentages = {};
    for (let rating = 5; rating >= 1; rating--) {
      ratingPercentages[rating] = totalReviews > 0 
        ? Math.round((ratingBreakdown[rating] / totalReviews) * 100)
        : 0;
    }

    await logDebug(`GET REVIEWS SUCCESS - Count: ${totalReviews}, Avg: ${averageRating}`);

    return corsResponse({
      reviews,
      stats: {
        averageRating,
        totalReviews,
        ratingBreakdown,
        ratingPercentages
      }
    });

  } catch (error) {
    await logDebug(`GET REVIEWS ERROR - ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
};

export const action = async ({ request }) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return corsResponse({}, 200);
  }

  if (request.method !== "POST") {
    return corsResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const formData = await request.formData();
    const productId = formData.get("productId");
    const shop = formData.get("shop");
    const rating = parseInt(formData.get("rating"), 10) || 5;
    const reviewerName = formData.get("reviewerName") || "Anonymous";
    const reviewerEmail = formData.get("reviewerEmail") || "";
    const reviewTitle = formData.get("reviewTitle") || "";
    const reviewBody = formData.get("reviewBody") || "";
    const imageFile = formData.get("image");

    await logDebug(`POST REVIEW - Product: ${productId}, Shop: ${shop}, Rating: ${rating}, Reviewer: ${reviewerName}`);

    if (!productId || !shop) {
      return corsResponse({ error: "Missing productId or shop parameter" }, 400);
    }

    // 1. Save uploaded images if present
    const imageFiles = formData.getAll("image");
    const imageUrls = [];

    for (const imageFile of imageFiles) {
      if (imageFile && typeof imageFile === "object" && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fs = await import("node:fs");
        const path = await import("node:path");
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate a clean safe filename with a random part to prevent collisions
        const randomPart = Math.random().toString(36).substring(2, 9);
        const safeName = `${Date.now()}-${randomPart}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(uploadDir, safeName);
        fs.writeFileSync(filePath, buffer);

        // Get ngrok / host origin
        const url = new URL(request.url);
        const imageUrl = `${url.origin}/uploads/${safeName}`;
        imageUrls.push(imageUrl);
        await logDebug(`IMAGE SAVED - Path: ${filePath}, URL: ${imageUrl}`);
      }
    }

    // 2. Get unauthenticated admin GraphQL client
    const { admin } = await unauthenticated.admin(shop);

    // 3. Fetch existing reviews
    const gid = productId.startsWith("gid://") ? productId : `gid://shopify/Product/${productId}`;
    const getResponse = await admin.graphql(
      `#graphql
      query getProductMetafield($id: ID!) {
        product(id: $id) {
          metafield(namespace: "reviews_app", key: "reviews_list") {
            value
          }
        }
      }`,
      {
        variables: { id: gid }
      }
    );

    const getResponseJson = await getResponse.json();
    const metafieldValue = getResponseJson.data?.product?.metafield?.value;

    let reviews = [];
    if (metafieldValue) {
      try {
        reviews = JSON.parse(metafieldValue);
      } catch (e) {
        await logDebug("PARSING ERROR - Resetting reviews array");
      }
    }

    // 4. Append the new review
    const newReview = {
      id: crypto.randomUUID(),
      name: reviewerName,
      email: reviewerEmail,
      rating,
      title: reviewTitle,
      body: reviewBody,
      imageUrl: imageUrls[0] || "",
      imageUrls,
      createdAt: new Date().toISOString()
    };

    reviews.unshift(newReview); // Add to the beginning of the list

    // 5. Save reviews back to Shopify product metafield
    const setResponse = await admin.graphql(
      `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: gid,
              namespace: "reviews_app",
              key: "reviews_list",
              type: "json",
              value: JSON.stringify(reviews)
            }
          ]
        }
      }
    );

    const setResponseJson = await setResponse.json();
    const userErrors = setResponseJson.data?.metafieldsSet?.userErrors || [];

    if (userErrors.length > 0) {
      await logDebug(`METAFIELD SET ERROR - ${JSON.stringify(userErrors)}`);
      return corsResponse({ error: "Failed to save review metafield", details: userErrors }, 500);
    }

    await logDebug(`POST REVIEW SUCCESS - New Review ID: ${newReview.id}`);
    return corsResponse({ success: true, review: newReview });

  } catch (error) {
    await logDebug(`POST REVIEW CRASH - ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
};
