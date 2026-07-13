import { authenticate, sessionStorage } from "../shopify.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    const shopSessions = await sessionStorage.findSessionsByShop(shop);
    if (shopSessions.length > 0) {
      const ids = shopSessions.map((s) => s.id);
      await sessionStorage.deleteSessions(ids);
    }
  }

  return new Response();
};
