import { boundary } from "@shopify/shopify-app-react-router/server";
import { Link } from "react-router";
import { authenticate } from "../shopify.server";
import "../styles/settings.css";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

/**
 * Settings overview (index) route.
 * Shown at exactly /app/settings. Lists the available settings sections,
 * each of which links to its own sub-route with an interactive, responsive grid.
 */
export default function AppSettingsIndex() {
  const sections = [
    // {
    //   badge: "General",
    //   className: "account",
    //   iconClass: "icon-account",
    //   icon: (
    //     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    //       <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    //       <polyline points="9 22 9 12 15 12 15 22"></polyline>
    //     </svg>
    //   ),
    //   title: "Account Information",
    //   description: "Manage your store account details, contact email, and profile settings.",
    //   href: "/app/settings/accountinformation",
    // },
    {
      badge: "Live Customizer",
      className: "widget",
      iconClass: "icon-widget",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
      title: "Widget Editor",
      description: "Customize layout templates, slide behaviors, stars, and forms on your storefront.",
      href: "/app/settings/widget",
    },
    {
      badge: "CSV Transfer",
      className: "importexport",
      iconClass: "icon-importexport",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 8 16 13"></polyline>
          <line x1="21" y1="8" x2="9" y2="8"></line>
          <polyline points="8 21 3 16 8 11"></polyline>
          <line x1="3" y1="16" x2="15" y2="16"></line>
        </svg>
      ),
      title: "Import & Export",
      description: "Bulk load reviews from spreadsheets or download unified backup CSV files instantly.",
      href: "/app/settings/importexport",
    }
  ];

  return (
    <s-page heading="Settings">
      {/* Hero Welcome Banner */}
      <div className="hero-banner">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.01em" }}>
          Reviews Control Center
        </h1>
        <p style={{ margin: 0, fontSize: "0.92rem", color: "#94a3b8", lineHeight: "1.6" }}>
          Configure widget layouts, customize ratings display, and manage your bulk imports/exports.
          All settings automatically synchronize to your active storefront theme.
        </p>
      </div>

      {/* Settings Options Grid */}
      <div className="settings-grid">
        {sections.map((section) => (
          <Link
            key={section.href}
            to={section.href}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div className={`settings-card ${section.className}`}>
              <h3 className="card-title">{section.title}</h3>
              <p className="card-description">{section.description}</p>

              <div className="card-footer">
                <span className="card-badge">{section.badge}</span>
                <span className="card-arrow">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
