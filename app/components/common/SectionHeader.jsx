/**
 * SectionHeader - Reusable hero/intro section for page headers.
 * Displays an icon, title, description, and optional badge.
 */
export default function SectionHeader({
  icon,
  title,
  description,
  badge,
  backgroundColor = "subdued",
}) {
  return (
    <s-box
      padding="xl"
      borderWidth="base"
      borderRadius="base"
      background={backgroundColor}
      style={{ marginBottom: "1.5rem" }}
    >
      <s-stack direction="block" gap="base">
        {icon && (
          <s-text variant="headingXl" as="div">
            {icon}
          </s-text>
        )}
        <s-stack direction="inline" gap="base" wrap={false}>
          <s-heading>{title}</s-heading>
          {badge && (
            <s-badge status={badge.status || "info"}>{badge.label}</s-badge>
          )}
        </s-stack>
        {description && (
          <s-paragraph>{description}</s-paragraph>
        )}
      </s-stack>
    </s-box>
  );
}