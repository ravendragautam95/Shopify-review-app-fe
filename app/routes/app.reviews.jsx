import { useState } from "react";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Button,
} from "@shopify/polaris";

import { useAppBridge } from "@shopify/app-bridge-react";

// A server-side logger helper to trace Admin behavior
const logDebug = async (message) => {
  console.log(`[Admin Reviews DEBUG] ${message}`);
};

// Loader fetches all products and compiles a list of all reviews from their metafields
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  await logDebug(`ADMIN LOADER START - Shop: ${session.shop}`);

  try {
    // Fetch products with their reviews metafields (limit to 50 for development)
    const response = await admin.graphql(
      `#graphql
      query getProductsWithReviews {
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              metafield(namespace: "reviews_app", key: "reviews_list") {
                value
              }
            }
          }
        }
      }`
    );

    const responseJson = await response.json();
    const productEdges = responseJson.data?.products?.edges || [];

    const allReviews = [];
    let totalRatingSum = 0;

    productEdges.forEach(({ node }) => {
      const metafieldValue = node.metafield?.value;
      if (metafieldValue) {
        try {
          const reviews = JSON.parse(metafieldValue);
          if (Array.isArray(reviews)) {
            reviews.forEach(review => {
              allReviews.push({
                ...review,
                productId: node.id,
                productTitle: node.title,
                productHandle: node.handle
              });
              totalRatingSum += parseInt(review.rating, 10) || 5;
            });
          }
        } catch (e) {
          console.error("Failed to parse reviews metafield for product:", node.id, e);
        }
      }
    });

    // Sort reviews by date descending
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0 ? parseFloat((totalRatingSum / totalReviews).toFixed(1)) : 0;

    await logDebug(`ADMIN LOADER SUCCESS - Found: ${totalReviews} reviews total across shop.`);

    return {
      reviews: allReviews,
      stats: {
        totalReviews,
        averageRating
      }
    };

  } catch (error) {
    await logDebug(`ADMIN LOADER CRASH - ${error.message}`);
    console.error("Admin Loader Error:", error);
    return {
      reviews: [],
      stats: { totalReviews: 0, averageRating: 0 },
      error: error.message
    };
  }
};

// Action handles moderation commands (like deleting a review)
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const productId = formData.get("productId");
  const reviewId = formData.get("reviewId");

  await logDebug(`ADMIN ACTION - Shop: ${session.shop}, Intent: ${intent}, Product: ${productId}, Review: ${reviewId}`);

  if (intent === "delete" && productId && reviewId) {
    try {
      // 1. Fetch current metafield value for the product
      const getResponse = await admin.graphql(
        `#graphql
        query getProductMetafield($id: ID!) {
          product(id: $id) {
            metafield(namespace: "reviews_app", key: "reviews_list") {
              value
            }
          }
        }`,
        {
          variables: { id: productId }
        }
      );

      const getResponseJson = await getResponse.json();
      const metafieldValue = getResponseJson.data?.product?.metafield?.value;

      if (!metafieldValue) {
        return { success: false, error: "Metafield not found" };
      }

      const reviews = JSON.parse(metafieldValue);
      // Filter out the deleted review
      const updatedReviews = reviews.filter(r => r.id !== reviewId);

      // 2. Save the updated list back
      const setResponse = await admin.graphql(
        `#graphql
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            metafields: [
              {
                ownerId: productId,
                namespace: "reviews_app",
                key: "reviews_list",
                type: "json",
                value: JSON.stringify(updatedReviews)
              }
            ]
          }
        }
      );

      const setResponseJson = await setResponse.json();
      const userErrors = setResponseJson.data?.metafieldsSet?.userErrors || [];

      if (userErrors.length > 0) {
        await logDebug(`ADMIN DELETE METAFIELD ERROR - ${JSON.stringify(userErrors)}`);
        return { success: false, error: "Failed to update metafield", details: userErrors };
      }

      await logDebug("ADMIN DELETE SUCCESS");
      return { success: true, deleted: reviewId };

    } catch (e) {
      await logDebug(`ADMIN DELETE CRASH - ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: "Invalid parameters" };
};

import "../styles/reviews.css";

// Deterministic avatar color based on name
const AVATAR_COLORS = [
  "#005bd3", "#008060", "#9c6ade", "#e07d10", "#c9a62c",
  "#d82c0d", "#0ea5e9", "#7c3aed", "#059669", "#b45309"
];
function avatarColor(name) {
  if (!name) return "#8c9196";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AppReviewsDashboard() {
  const { reviews, stats, error } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const [deletingId, setDeletingId] = useState(null);
  const isDeleting = navigation.state === "submitting" && navigation.formData?.get("intent") === "delete";

  // --- Filter & Sort State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [dateSortDir, setDateSortDir] = useState("desc"); // "asc" | "desc"

  const handleDelete = (productId, reviewId) => {
    if (confirm("Are you sure you want to delete this review? This will remove it permanently from the storefront.")) {
      setDeletingId(reviewId);
      submit({ intent: "delete", productId, reviewId }, { method: "POST" });
      shopify.toast.show("Deleting review...");
    }
  };

  const resourceName = { singular: "review", plural: "reviews" };
  const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

  // Unique product titles for dropdown
  const uniqueProducts = [...new Set(reviews.map(r => r.productTitle).filter(Boolean))].sort();

  // --- Cumulative filtering pipeline ---
  const filteredReviews = reviews
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (r.email && r.email.toLowerCase().includes(q)) ||
             (r.productTitle && r.productTitle.toLowerCase().includes(q));
    })
    .filter(r => !selectedProduct || r.productTitle === selectedProduct)
    .filter(r => !selectedRating || parseInt(r.rating, 10) === parseInt(selectedRating, 10))
    .sort((a, b) => {
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return dateSortDir === "desc" ? diff : -diff;
    });

  const activeFilterCount = [searchQuery, selectedProduct, selectedRating].filter(Boolean).length;
  const clearAllFilters = () => { setSearchQuery(""); setSelectedProduct(""); setSelectedRating(""); setDateSortDir("desc"); };

  const rowMarkup = filteredReviews.map(
    ({ id, name, email, rating, title, body, createdAt, productId, productTitle }, index) => {
      const dateStr = new Date(createdAt).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata", month: "short", day: "numeric",
        year: "numeric", hour: "numeric", minute: "2-digit", hour12: true
      }) + " IST";
      const isThisDeleting = isDeleting && deletingId === id;
      const bgColor = avatarColor(name);

      return (
        <IndexTable.Row id={id} key={id} position={index}>
          {/* Reviewer */}
          <IndexTable.Cell>
            <div className="reviews-cell-reviewer">
              <div className="reviews-avatar" style={{ backgroundColor: bgColor }}>
                {name ? name.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="reviews-cell-reviewer__info">
                <div className="reviews-cell-reviewer__name">{name}</div>
                <div className="reviews-cell-reviewer__email">{email}</div>
              </div>
            </div>
          </IndexTable.Cell>

          {/* Rating */}
          <IndexTable.Cell>
            <div className="reviews-cell-rating">
              <span className="reviews-stars">{renderStars(rating)}</span>
              <div className="reviews-cell-rating__label">{rating} / 5</div>
            </div>
          </IndexTable.Cell>

          {/* Review Details */}
          <IndexTable.Cell>
            <div className="reviews-cell-body">
              {title && <div className="reviews-cell-body__title">{title}</div>}
              <div className="reviews-cell-body__text">{body}</div>
            </div>
          </IndexTable.Cell>

          {/* Product */}
          <IndexTable.Cell>
            <div className="reviews-cell-product">{productTitle}</div>
          </IndexTable.Cell>

          {/* Date */}
          <IndexTable.Cell>
            <span className="reviews-cell-date">{dateStr}</span>
          </IndexTable.Cell>

          {/* Actions */}
          <IndexTable.Cell>
            <Button
              tone="critical" variant="secondary"
              loading={isThisDeleting} disabled={isDeleting}
              onClick={() => handleDelete(productId, id)}
            >
              Delete
            </Button>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  );

  return (
    <Page title="Product Reviews Moderation">
      <Layout>
        {/* Error */}
        {error && (
          <Layout.Section>
            <div className="reviews-error-banner">
              <span>⚠️</span> {error}
            </div>
          </Layout.Section>
        )}

        {/* ── Stat Cards ── */}
        <Layout.Section>
          <div className="reviews-stats-row">
            <div className="reviews-stat-card">
              <div className="reviews-stat-icon reviews-stat-icon--total">📋</div>
              <div className="reviews-stat-body">
                <span className="reviews-stat-label">Total Reviews</span>
                <span className="reviews-stat-value">{stats.totalReviews}</span>
                <span className="reviews-stat-sub">all time</span>
              </div>
            </div>
            <div className="reviews-stat-card">
              <div className="reviews-stat-icon reviews-stat-icon--rating">⭐</div>
              <div className="reviews-stat-body">
                <span className="reviews-stat-label">Average Rating</span>
                <span className="reviews-stat-value">{stats.averageRating.toFixed(1)}</span>
                <span className="reviews-stat-sub">out of 5 stars</span>
              </div>
            </div>
            <div className="reviews-stat-card">
              <div className="reviews-stat-icon reviews-stat-icon--showing">🔍</div>
              <div className="reviews-stat-body">
                <span className="reviews-stat-label">Showing</span>
                <span className="reviews-stat-value">{filteredReviews.length}</span>
                <span className="reviews-stat-sub">
                  {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active` : "no filters"}
                </span>
              </div>
            </div>
          </div>
        </Layout.Section>

        {/* ── Filter Bar ── */}
        <Layout.Section>
          <div className="reviews-filter-bar">
            <div className="reviews-filter-bar__top">

              {/* Search */}
              <div className="reviews-filter-field" style={{ flex: 2, minWidth: "240px" }}>
                <span className="reviews-filter-bar__section-label">Search</span>
                <div className="reviews-search-wrap" style={{ flex: "unset", minWidth: "unset" }}>
                  <svg className="reviews-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    className="reviews-search-input"
                    placeholder="Email or product title…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Product Filter */}
              <div className="reviews-filter-field">
                <span className="reviews-filter-bar__section-label">Product</span>
                <select
                  className={`reviews-filter-select${selectedProduct ? " reviews-filter-select--active" : ""}`}
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="">All products</option>
                  {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Rating Filter — now a dropdown */}
              <div className="reviews-filter-field">
                <span className="reviews-filter-bar__section-label">Rating</span>
                <select
                  className={`reviews-filter-select${selectedRating ? " reviews-filter-select--rating-active" : ""}`}
                  value={selectedRating}
                  onChange={e => setSelectedRating(e.target.value)}
                >
                  <option value="">All ratings</option>
                  <option value="5">★★★★★ — 5 Stars</option>
                  <option value="4">★★★★☆ — 4 Stars</option>
                  <option value="3">★★★☆☆ — 3 Stars</option>
                  <option value="2">★★☆☆☆ — 2 Stars</option>
                  <option value="1">★☆☆☆☆ — 1 Star</option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="reviews-chips-row">
                {searchQuery && (
                  <span className="reviews-filter-chip">
                    Search: "{searchQuery}"
                    <button className="reviews-filter-chip__remove" onClick={() => setSearchQuery("")} title="Remove">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                )}
                {selectedProduct && (
                  <span className="reviews-filter-chip">
                    {selectedProduct}
                    <button className="reviews-filter-chip__remove" onClick={() => setSelectedProduct("")} title="Remove">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                )}
                {selectedRating && (
                  <span className="reviews-filter-chip reviews-filter-chip--rating">
                    {"★".repeat(Number(selectedRating))} {selectedRating} Star{selectedRating !== "1" ? "s" : ""}
                    <button className="reviews-filter-chip__remove" onClick={() => setSelectedRating("")} title="Remove">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                )}
                <button className="reviews-clear-all-btn" onClick={clearAllFilters}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </Layout.Section>

        {/* ── Table ── */}
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={filteredReviews.length}
              selectable={false}
              headings={[
                { title: "Reviewer",       id: "col-reviewer",  minWidth: "180px" },
                { title: "Rating",         id: "col-rating",    minWidth: "90px"  },
                { title: "Review Details", id: "col-details",   minWidth: "220px" },
                { title: "Product",        id: "col-product",   minWidth: "160px" },
                {
                  id: "col-date",
                  minWidth: "160px",
                  title: (
                    <button
                      className="reviews-date-sort-btn"
                      onClick={() => setDateSortDir(d => d === "desc" ? "asc" : "desc")}
                    >
                      Date
                      <span className="reviews-date-sort-arrows">
                        <span style={{ opacity: dateSortDir === "asc" ? 1 : 0.3 }}>▲</span>
                        <span style={{ opacity: dateSortDir === "desc" ? 1 : 0.3 }}>▼</span>
                      </span>
                    </button>
                  )
                },
                { title: "Actions",        id: "col-actions",   minWidth: "90px"  },
              ]}
            >
              {filteredReviews.length === 0 ? (
                <IndexTable.Row id="empty" position={0}>
                  <IndexTable.Cell colSpan={6}>
                    <div className="reviews-empty-state">
                      <div className="reviews-empty-state__icon">📭</div>
                      <div className="reviews-empty-state__title">
                        {reviews.length === 0 ? "No reviews yet" : "No matching reviews"}
                      </div>
                      <div className="reviews-empty-state__sub">
                        {reviews.length === 0
                          ? "Reviews submitted on the storefront will appear here."
                          : "Try adjusting your search or filters to find what you're looking for."}
                      </div>
                    </div>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ) : rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}