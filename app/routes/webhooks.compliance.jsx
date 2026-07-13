import { authenticate, sessionStorage } from "../shopify.server";

// Mandatory GDPR compliance webhook handler
export const action = async ({ request }) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);
    console.log(`Received compliance webhook: ${topic} for shop: ${shop}`);

    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST":
        // Shopify is asking for all data stored by this app for a customer.
        // Since all reviews are stored natively in the shop's product metafields,
        // and we don't store persistent customer records in our database:
        return new Response(
          JSON.stringify({ message: "No customer data is stored outside Shopify product metafields" }),
          { status: 200 }
        );

      case "CUSTOMERS_REDACT":
        // Shopify is asking to redact/delete a customer's data.
        // We log the request. In a production environment, if you store customer PII 
        // outside of Shopify metafields, you would delete it here.
        console.log(`GDPR customer redact payload for customer email: ${payload.customer.email}`);
        return new Response(JSON.stringify({ success: true }), { status: 200 });

      case "SHOP_REDACT":
        // Shopify is asking to delete all data related to a shop that uninstalled.
        // Clean up session records in the SQLite/Production database.
        if (shop) {
          const shopSessions = await sessionStorage.findSessionsByShop(shop);
          if (shopSessions.length > 0) {
            const ids = shopSessions.map((s) => s.id);
            await sessionStorage.deleteSessions(ids);
          }
          console.log(`GDPR shop redact: Cleaned up all sessions for shop: ${shop}`);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });

      default:
        return new Response("Unknown compliance topic", { status: 400 });
    }
  } catch (error) {
    console.error("GDPR Webhook execution error:", error.message);
    return new Response("Webhook authentication failed or crashed", { status: 401 });
  }
};
