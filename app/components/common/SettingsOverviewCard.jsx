import { Link } from "react-router";

/**
 * SettingsOverviewCard - Clickable card shown on the settings overview page.
 * Displays icon, title, and description, then links to the detail sub-page.
 */
export default function SettingsOverviewCard({ icon, title, description, href }) {
  return (
    <Link
      to={href}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <s-box
        padding="base"
        borderWidth="base"
        borderRadius="base"
        background="surface"
        style={{
          border: "1px solid var(--s-border-subdued, #e1e3e5)",
          cursor: "pointer",
          transition: "box-shadow 0.2s, transform 0.2s",
          marginBottom: "0.75rem",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        <s-stack direction="inline" gap="base" wrap={false} alignment="center">
          <s-text variant="headingXl" as="div">
            {icon}
          </s-text>
          <div style={{ flex: 1 }}>
            <s-heading>{title}</s-heading>
            <s-paragraph>
              <s-text variant="bodySm" subdued>
                {description} 
              </s-text>
            </s-paragraph>
          </div>
          <s-text variant="headingLg" subdued>
            →
          </s-text>
        </s-stack>
      </s-box>
    </Link>
  );
}