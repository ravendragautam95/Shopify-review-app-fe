import { useState, useEffect } from "react";
import { useSubmit, useActionData, useNavigation, useLoaderData, redirect } from "react-router";
import { authenticate, PLAN_DIAMOND, PLAN_GOLD, PLAN_SILVER } from "../shopify.server";
import { boundary, BillingInterval } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Button } from '@shopify/polaris'
// Link stylesheet from public/assets/billing.css
export const links = () => [
    { rel: "stylesheet", href: "/assets/billing.css" }
];



// A server-side logger helper to trace Billing API behavior
const logDebug = async (message) => {
    console.log(`[Billing DEBUG] ${message}`);
};

//The loader ensures authentication and retrieves current settings/plans if needed
export const loader = async ({ request }) => {
    // 1. Properly authenticate the admin request
    const { billing, session } = await authenticate.admin(request);

    try {
        await logDebug(`LOADER START - Shop: ${session.shop}`);

        // 2. Use V3 billing.check to cleanly scan active subscriptions
        const billingCheck = await billing.check({
            plans: [PLAN_SILVER, PLAN_GOLD, PLAN_DIAMOND],
            isTest: true,
        });

        // Determine which plan is active
        const activeSub = billingCheck.appSubscriptions[0]?.name;
        let activePlanId = "free";
        if (activeSub === PLAN_SILVER) activePlanId = "silver";
        else if (activeSub === PLAN_GOLD) activePlanId = "gold";
        else if (activeSub === PLAN_DIAMOND) activePlanId = "diamond";

        await logDebug(`LOADER CHECK SUCCESS - hasActivePayment: ${billingCheck.hasActivePayment}, activePlanId: ${activePlanId}`);

        // 3. Pass active plan status variables down to your frontend component
        return {
            activePlanId,
            hasActivePlan: billingCheck.hasActivePayment,
            activeSubscriptions: billingCheck.appSubscriptions || []
        };

    } catch (error) {
        await logDebug(`LOADER CRASH - error: ${error.message}, stack: ${error.stack}`);
        console.error("V3 Billing Loader Crash Log:", error);

        // Fallback safety return so your page doesn't break
        return {
            activePlanId: "free",
            hasActivePlan: false,
            activeSubscriptions: [],
            error: error.message
        };
    }
};

// Action handles live Shopify Billing API V3 subscription activation and cancellation

export const action = async ({ request }) => {
    const { admin, billing, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const planId = formData.get("planId"); // 'silver', 'gold', or 'diamond'
    const intent = formData.get("intent");

    // Map your frontend card IDs to your shopify.server.js Plan keys
    let selectedPlanConfigName = PLAN_GOLD;
    if (planId === "silver") selectedPlanConfigName = PLAN_SILVER;
    if (planId === "diamond") selectedPlanConfigName = PLAN_DIAMOND;

    try {
        await logDebug(`ACTION START - Shop: ${session.shop}, intent: ${intent}, planId: ${planId}, configName: ${selectedPlanConfigName}`);

        // --- 1. HANDLE SUBSCRIPTION CANCELLATION (V3 WORKFLOW) ---
        if (intent === "cancel") {
            // Check for any active plans in the new engine
            const checkActive = await billing.check({
                plans: [PLAN_SILVER, PLAN_GOLD, PLAN_DIAMOND],
                isTest: true,
            });

            await logDebug(`ACTION CANCEL CHECK - hasActivePayment: ${checkActive.hasActivePayment}`);

            if (checkActive.hasActivePayment) {
                // Fetch subscription global ID details
                const currentSubscriptionId = checkActive.appSubscriptions[0].id;
                await logDebug(`ACTION CANCELING SUBSCRIPTION - ID: ${currentSubscriptionId}`);

                await billing.cancel({
                    subscriptionId: currentSubscriptionId,
                    isTest: true,
                });
                return { success: true, planId: "free", cancelled: true };
            }

            return { success: false, error: "No active subscription found to cancel." };
        }

        // --- 2. HANDLE PLAN SELECTION / UPGRADE (V3 WORKFLOW) ---
        if (intent === "subscribe") {
            const shopName = session.shop.split('.')[0];
            const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/review-app-fe/app/billing`;
            const couponCode = formData.get("couponCode");

            let lineItemsOverride;
            if (couponCode === "SAVE20") {
                lineItemsOverride = [
                    {
                        interval: BillingInterval.Every30Days,
                        discount: {
                            value: {
                                percentage: 0.2
                            }
                        }
                    }
                ];
                await logDebug(`COUPON VALIDATED - Code: ${couponCode}, 20% discount applied`);
            } else if (couponCode === "SAVE50") {
                lineItemsOverride = [
                    {
                        interval: BillingInterval.Every30Days,
                        discount: {
                            value: {
                                percentage: 0.5
                            }
                        }
                    }
                ];
                await logDebug(`COUPON VALIDATED - Code: ${couponCode}, 50% discount applied`);
            }

            await logDebug(`ACTION SUBSCRIBE START - returnUrl: ${returnUrl}`);

            try {
                // Require checks if active, otherwise throws redirect to checkout URL
                await logDebug(`ACTION SUBSCRIBE - Calling billing.require`);
                await billing.require({
                    plans: [selectedPlanConfigName],
                    isTest: true,
                    onFailure: async () => {
                        await logDebug(`ACTION SUBSCRIBE onFailure callback triggered - calling billing.request`);
                        return billing.request({
                            plan: selectedPlanConfigName,
                            isTest: true,
                            returnUrl: returnUrl,
                            ...(lineItemsOverride ? { lineItems: lineItemsOverride } : {})
                        });
                    }
                });

                await logDebug(`ACTION SUBSCRIBE REQUIRE PASSED (Already subscribed)`);
                return { success: true, planId };
            } catch (billingError) {
                const isResponse = billingError instanceof Response;
                await logDebug(`ACTION SUBSCRIBE CATCH - error: ${billingError.message || 'unknown'}, isResponse: ${isResponse}, status: ${billingError.status || 'none'}, errorData: ${JSON.stringify(billingError.errorData || {})}, response: ${JSON.stringify(billingError.response || {})}`);
                if (isResponse) {
                    await logDebug(`ACTION SUBSCRIBE CATCH REDIRECT - location: ${billingError.headers.get("Location")}`);
                }

                throw billingError;
            }
        }

        return { success: true, planId };

    } catch (error) {
        // If it is a clean navigation redirect, pass it through standard browser handling layers
        if (error instanceof Response || (error.status && error.status >= 300 && error.status < 400)) {
            await logDebug(`ACTION OUTER REDIRECT BUBBLE - status: ${error.status}`);
            throw error;
        }
        await logDebug(`ACTION OUTER CRASH - error: ${error.message}, stack: ${error.stack}`);
        console.error("V3 Billing Error Catch Log:", error);

        // Detailed error properties logging
        if (error && typeof error === 'object') {
            console.error("Detailed error properties:", Object.getOwnPropertyNames(error).reduce((acc, key) => {
                acc[key] = error[key];
                return acc;
            }, {}));
        }

        return { success: false, error: error.message || "An unknown billing error occurred." };
    }
};



const PLANS = [
    {
        index: 0,
        id: "free",
        name: "Free",
        price: "Free",
        priceSuffix: "",
        trialText: "",
        features: [
            "50 products",
            "5 collections",
            "50 blogs",
            "5 custom pages"
        ],
        isActive: false,
        isFree: true,
    },
    {
        index: 1,
        id: "silver",
        name: "Silver",
        price: "$4.99",
        priceSuffix: "per month",
        trialText: "7 days free trial",
        features: [
            "250 products",
            "50 collections",
            "250 blogs",
            "50 custom pages"
        ],
        isActive: false,
        isFree: false,
    },
    {
        index: 2,
        id: "gold",
        name: "Gold",
        price: "$9.99",
        priceSuffix: "per month",
        trialText: "7 days free trial",
        features: [
            "2500 products",
            "500 collections",
            "2500 blogs",
            "500 custom pages"
        ],
        isActive: true, // Shown as "Current Plan" in the screenshot
        isFree: false,
    },
    {
        index: 3,
        id: "diamond",
        name: "Diamond",
        price: "$49.99",
        priceSuffix: "per month",
        trialText: "",
        features: [
            "Unlimited products",
            "Unlimited collections",
            "Unlimited blogs",
            "Unlimited custom pages"
        ],
        isActive: false,
        isFree: false,
    }
];

// Reusable SVG Check Icon Component
const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="#008060"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginRight: "12px", flexShrink: 0 }}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default function BillingPage() {
    const loaderData = useLoaderData();
    const submit = useSubmit();
    const actionData = useActionData();
    const navigation = useNavigation();
    const shopify = useAppBridge();

    const [activePlan, setActivePlan] = useState(loaderData?.activePlanId || "");
    const isActivating = navigation.state === "submitting";

    const [clickedPlanId, setClickedPlanId] = useState(null);
    console.log("Current active plan in state:", activePlan, "Loader data:", loaderData);

    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState("");
    const [couponError, setCouponError] = useState("");

    const handleApplyCoupon = () => {
        const uppercaseCoupon = couponInput.trim().toUpperCase();
        if (uppercaseCoupon === "SAVE20" || uppercaseCoupon === "SAVE50") {
            setAppliedCoupon(uppercaseCoupon);
            setCouponError("");
            shopify.toast.show(`Coupon "${uppercaseCoupon}" applied successfully!`);
        } else {
            setCouponError("Invalid coupon code. Try SAVE20 or SAVE50.");
            setAppliedCoupon("");
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon("");
        setCouponInput("");
        setCouponError("");
        shopify.toast.show("Coupon removed.");
    };

    useEffect(() => {
        if (actionData?.success) {
            setActivePlan(actionData.planId);
            if (actionData.cancelled) {
                shopify.toast.show("Subscription cancelled. Downgraded to Free plan.");
            } else {
                shopify.toast.show(`Plan updated to ${actionData.planId.toUpperCase()} successfully`);
            }
        } else if (actionData?.error) {
            shopify.toast.show(`Error: ${actionData.error}`);
        }
    }, [actionData, shopify]);

    // Sync state if loader data updates
    useEffect(() => {
        if (loaderData?.activePlanId) {
            setActivePlan(loaderData.activePlanId);
        }
    }, [loaderData]);



    const handleActivatePlan = (planId) => {
        setClickedPlanId(planId); // Set the target plan ID immediately on click
        submit({ planId, intent: "subscribe", couponCode: appliedCoupon }, { method: "POST" });
    };

    const handleCancelPlan = () => {
        setClickedPlanId("cancel"); // Track cancellation loading state distinctly
        submit({ intent: "cancel" }, { method: "POST" });
    };



    useEffect(() => {
        if (!isActivating) {
            setClickedPlanId(null);
        }
    }, [isActivating]);
    return (
        <s-page heading="Subscription Plans" back-link="/app/settings">
            <s-paragraph>
                <span className="billing-subtitle">
                    Choose a plan that works best for your business
                </span>
            </s-paragraph>

            {/* Coupon Code Section */}
            <div style={{
                maxWidth: "600px",
                margin: "1.5rem auto 2rem auto",
                padding: "1.25rem",
                background: "#f9fafb",
                border: "1px solid #e1e3e5",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                    <div style={{ flexGrow: 1 }}>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#202223", marginBottom: "0.375rem" }}>
                            Have a Promo Code?
                        </label>
                        <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            placeholder="Enter coupon code (e.g. SAVE20)"
                            disabled={!!appliedCoupon}
                            style={{
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                border: "1px solid #babfc3",
                                borderRadius: "6px",
                                boxSizing: "border-box",
                                fontSize: "0.875rem",
                                background: appliedCoupon ? "#f1f2f4" : "#ffffff",
                                color: appliedCoupon ? "#6d7175" : "#202223"
                            }}
                        />
                    </div>
                    {appliedCoupon ? (
                        <Button onClick={handleRemoveCoupon} variant="plain" tone="critical">
                            Remove
                        </Button>
                    ) : (
                        <Button onClick={handleApplyCoupon} disabled={!couponInput.trim()}>
                            Apply
                        </Button>
                    )}
                </div>
                {appliedCoupon && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#008060", fontWeight: "500", display: "flex", alignItems: "center" }}>
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" style={{ marginRight: "6px" }}>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Coupon Applied: {appliedCoupon === "SAVE20" ? "20% Off" : "50% Off"}
                    </div>
                )}
                {couponError && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#d72c0d" }}>
                        {couponError}
                    </div>
                )}
            </div>

            {/* Grid container using responsive CSS grid classes */}
            <div className="billing-grid">
                {PLANS.map((plan, index) => {
                    const isCurrent = activePlan === plan.id;

                    let displayedPrice = plan.price;
                    let hasDiscount = false;
                    let originalPrice = plan.price;

                    if (appliedCoupon && !plan.isFree) {
                        const basePriceNum = parseFloat(plan.price.replace("$", ""));
                        let discountFraction = 0;
                        if (appliedCoupon === "SAVE20") discountFraction = 0.2;
                        else if (appliedCoupon === "SAVE50") discountFraction = 0.5;

                        if (discountFraction > 0) {
                            const discountedVal = basePriceNum * (1 - discountFraction);
                            displayedPrice = `$${discountedVal.toFixed(2)}`;
                            hasDiscount = true;
                        }
                    }

                    return (
                        <div
                            key={index}
                            className={`plan-card ${isCurrent ? "current-plan" : ""}`}
                        >
                            {/* Plan Header details */}
                            <div className="plan-header">
                                <h3 className="plan-name">
                                    {plan.name}
                                </h3>

                                <div className="plan-price-container">
                                    {hasDiscount ? (
                                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                                            <span className="plan-price" style={{ color: "#008060" }}>
                                                {displayedPrice}
                                            </span>
                                            <span style={{ textDecoration: "line-through", color: "#8c9196", fontSize: "0.875rem" }}>
                                                {originalPrice}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="plan-price">
                                            {plan.price}
                                        </span>
                                    )}
                                    {plan.priceSuffix && (
                                        <span className="plan-price-suffix">
                                            {plan.priceSuffix}
                                        </span>
                                    )}
                                </div>

                                {/* Free trial subtext */}
                                <div className="plan-trial-container">
                                    {plan.trialText ? (
                                        <span className="plan-trial-text">
                                            {plan.trialText}
                                        </span>
                                    ) : (
                                        <span>&nbsp;</span>
                                    )}
                                </div>
                            </div>

                            {/* Card Divider */}
                            <hr className="plan-divider" />

                            {/* Plan Features */}
                            <ul className="plan-features-list">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="plan-feature-item">
                                        <CheckIcon />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Plan Action Button */}
                            <div>
                                {isCurrent ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        <Button disabled fullWidth className="plan-btn-current">
                                            Current Plan
                                        </Button>
                                        {!plan.isFree && (
                                            <div style={{ width: "100%" }}>
                                                <Button
                                                    onClick={handleCancelPlan}
                                                    fullWidth
                                                    // Only shows loading spinner on the active cancellation target
                                                    loading={isActivating && clickedPlanId === "cancel"}
                                                    disabled={isActivating}
                                                    className="plan-btn-cancel"
                                                >
                                                    Cancel Plan
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : plan.isFree ? (
                                    <div className="plan-btn-free-placeholder" />
                                ) : (
                                    <div style={{ width: "100%" }} className="plan-btn-activate">
                                        <Button
                                            onClick={() => handleActivatePlan(plan.id)} // Streamlined direct execution
                                            fullWidth
                                            // Only triggers spinner UI explicitly if this exact plan card is processing mutations
                                            loading={isActivating && clickedPlanId === plan.id}
                                            disabled={isActivating}
                                            className="plan-btn-activate "

                                        >
                                            Activate Plan
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </s-page>
    );
}

export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};