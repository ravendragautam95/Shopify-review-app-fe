import { boundary } from "@shopify/shopify-app-react-router/server";
import { Outlet } from "react-router";

/**
 * Settings layout route.
 * Renders nothing of its own except an <Outlet /> so that:
 *   - /app/settings                      -> app.settings._index.jsx (overview cards)
 *   - /app/settings/accountinformation   -> app.settings.accountinformation.jsx
 *   - /app/settings/personalpreferences  -> app.settings.personalpreferences.jsx
 */
export default function AppSettingsLayout() {
  return <Outlet />;
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
