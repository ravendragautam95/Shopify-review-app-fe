/**
 * SuccessCard - Reusable component for displaying success state data.
 * Accepts a title and an array of { label, value } pairs.
 */
export default function SuccessCard({ title, data = [] }) {
  return (
    <s-section heading={title}>
      <s-box
        padding="base"
        borderWidth="base"
        borderRadius="base"
        background="subdued"
      >
        <s-stack direction="block" gap="base">
          {data.map((item, index) => (
            <s-paragraph key={index}>
              <s-text fontWeight="bold">{item.label}: </s-text>
              <s-text>{item.value}</s-text>
            </s-paragraph>
          ))}
        </s-stack>
      </s-box>
    </s-section>
  );
}