/**
 * SettingsSection - Reusable collapsible settings group card.
 * Each section has a title, optional description, and content area.
 */
import { useState } from "react";

export default function SettingsSection({
  title,
  description,
  children,
  defaultOpen = true,
  icon,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <s-box
      padding="none"
      borderWidth="base"
      borderRadius="base"
      background="surface"
      style={{
        marginBottom: "1rem",
        overflow: "hidden",
        border: "1px solid var(--s-border-subdued, #e1e3e5)",
      }}
    >
      {/* Section Header - Clickable to toggle */}
      <s-box
        padding="base"
        background="subdued"
        style={{
          cursor: "pointer",
          borderBottom: isOpen ? "1px solid var(--s-border-subdued, #e1e3e5)" : "none",
          userSelect: "none",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <s-stack direction="inline" gap="base" wrap={false} alignment="center">
          {icon && <s-text>{icon}</s-text>}
          <div style={{ flex: 1 }}>
            <s-heading>{title}</s-heading>
            {description && (
              <s-paragraph>
                <s-text variant="bodySm" subdued>
                  {description}
                </s-text>
              </s-paragraph>
            )}
          </div>
          <s-text variant="bodyLg" subdued>
            {isOpen ? "−" : "+"}
          </s-text>
        </s-stack>
      </s-box>

      {/* Section Content */}
      {isOpen && (
        <s-box padding="base" background="surface">
          {children}
        </s-box>
      )}
    </s-box>
  );
}