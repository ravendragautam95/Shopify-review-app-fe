/**
 * ReviewForm - Reusable form component for submitting review data.
 * Uses React Router fetcher for form submission with loading/success states.
 */
import { useEffect } from "react";
import { useFetcher, useNavigation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import SuccessCard from "../common/SuccessCard";

export default function ReviewForm() {
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const isLoading =
    fetcher.state !== "idle" && fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Review submitted successfully");
    }
  }, [fetcher.data?.success, shopify]);

  return (
    <s-stack direction="block" gap="xl">
      <fetcher.Form method="POST" style={{ maxWidth: "500px" }}>
        <s-stack direction="block" gap="base">
          <s-text-field
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Enter your full name"
            disabled={isLoading}
          />

          <s-text-field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Enter your email address"
            disabled={isLoading}
          />

          <s-button
            submit
            variant="primary"
            {...(isLoading ? { loading: true } : {})}
          >
            Submit Review
          </s-button>
        </s-stack>
      </fetcher.Form>

      {fetcher.data?.success && (
        <SuccessCard
          title="Submission Successful!"
          data={[
            { label: "Name", value: fetcher.data.name },
            { label: "Email", value: fetcher.data.email },
          ]}
        />
      )}

      {fetcher.data?.error && (
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="critical"
        >
          <s-paragraph>
            <s-text>Error: {fetcher.data.error}</s-text>
          </s-paragraph>
        </s-box>
      )}
    </s-stack>
  );
}