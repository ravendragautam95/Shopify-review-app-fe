import { boundary } from "@shopify/shopify-app-react-router/server";
import { Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop || "";
  const shopName = shop ? shop.split(".")[0] : "";
  const themeEditorUrl = shopName
    ? `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps`
    : "https://admin.shopify.com";

  return { shop, themeEditorUrl };
};

export default function Index() {
  const { themeEditorUrl } = useLoaderData();

  return (
    <s-page heading="Netliy Product Reviews Dashboard">
      <s-section heading="Quick Setup & Onboarding Guide">
        <s-paragraph>
          Follow these quick steps to set up and display product reviews on your storefront:
        </s-paragraph>
        <s-ordered-list>
          <s-list-item>
            <strong>Step 1: Customize Your Review Widget</strong> — Go to{" "}
            <Link to="/app/settings/widget">Widget Settings</Link> to customize star colors, layouts, and display options.
          </s-list-item>
          <s-list-item>
            <strong>Step 2: Add App Block to Your Theme</strong> — Click the button below to open the Shopify Theme Editor and add the <strong>Netliy Reviews Widget</strong> to your Product Page.
          </s-list-item>
          <s-list-item>
            <strong>Step 3: Moderate Reviews</strong> — View, approve, or reply to customer reviews in the{" "}
            <Link to="/app/reviews">Reviews Manager</Link>.
          </s-list-item>
        </s-ordered-list>
        
        <div style={{ marginTop: "16px" }}>
          <a
            href={themeEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              backgroundColor: "#005bd3",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            🎨 Open Shopify Theme Editor (Deep Link)
          </a>
        </div>
      </s-section>

      <s-section heading="Quick Navigation">
        <s-unordered-list>
          <s-list-item>
            <Link to="/app/reviews">Manage Customer Reviews</Link>
          </s-list-item>
          <s-list-item>
            <Link to="/app/settings/widget">Widget & Display Settings</Link>
          </s-list-item>
          <s-list-item>
            <Link to="/app/settings/importexport">Import / Export Reviews (CSV)</Link>
          </s-list-item>
          <s-list-item>
            <Link to="/app/billing">Subscription & Billing Plans</Link>
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="App Information">
        <s-paragraph>
          <s-text>Version: </s-text>1.0.0
        </s-paragraph>
        <s-paragraph>
          <s-text>Status: </s-text>
          <span style={{ color: "#008000", fontWeight: "600" }}>Active & Compliant</span>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};