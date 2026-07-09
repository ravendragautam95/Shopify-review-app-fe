import { boundary } from "@shopify/shopify-app-react-router/server";
import { Link } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <s-page heading="Welcome to Reviews App">
      <s-section heading="Dashboard">
        <s-paragraph>
          Welcome to the Reviews App! Manage customer reviews, configure settings, and more.
        </s-paragraph>
        <s-paragraph>
          Visit the <Link to="/app/settings">Settings page</Link> to submit your review or configure your preferences.
        </s-paragraph>
      </s-section>

      <s-section heading="Getting Started">
        <s-unordered-list>
          <s-list-item>
            Go to <Link to="/app/settings">Settings</Link> to submit a review with your name and email.
          </s-list-item>
          <s-list-item>
            Explore the app to see how reviews are managed.
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="App Info">
        <s-paragraph>
          <s-text>Version: </s-text>1.0.0
        </s-paragraph>
        <s-paragraph>
          <s-text>Framework: </s-text>
          <a href="https://reactrouter.com/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
            React Router
          </a>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};