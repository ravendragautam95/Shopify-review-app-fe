import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function LayoutSelector({
  selectedLayout,
  handleSelectLayout,
  layoutConfigs,
  submit,
  publishedLayout,
  shop
}) {
  const shopify = useAppBridge();
  const [apiUrl, setApiUrl] = useState("");
  const [postUrl, setPostUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiUrl(`${window.location.origin}/api/reviews?shop=${shop || "demoharsh-1dds80q1.myshopify.com"}&productId=[PRODUCT_ID]`);
      setPostUrl(`${window.location.origin}/api/reviews`);
    }
  }, [shop]);

  return (
    <s-page heading="Widgets" back-link="/app/settings">
      <div className="layout-header-bar">
        <p className="layout-header-subtext">
          Select a layout strategy for your customer reviews section on the storefront.
        </p>
        <div className="layout-status-badge">
          <span>test-data (live)</span>
          <span className="layout-status-arrow">▼</span>
        </div>
      </div>

      {/* Layout Selection Cards */}
      <div className="layout-cards-grid">
        {/* Card 1: Layout 1 (Standard Cards & Static Form) */}
        <div
          className={`layout-card ${selectedLayout === "layout_1" ? "active" : ""}`}
          onClick={() => handleSelectLayout("layout_1")}
        >
          <div className="layout-card-preview-banner layout-1-bg">
            <div className="layout-card-mini-canvas">
              <div className="layout-card-mini-title">Customer Reviews (Layout 1)</div>
              {/* Form Miniature (Static) */}
              <div className="mini-form-dashed-box">
                <div className="mini-form-indicator" />
                <div className="mini-form-line" />
              </div>
              {/* Review Card */}
              <div className="mini-review-row">
                <div className="mini-avatar" />
                <div className="mini-line" />
              </div>
            </div>
            {selectedLayout === "layout_1" && (
              <div className="layout-card-check-badge">✓</div>
            )}
          </div>
          <div className="layout-card-details">
            <div>
              <div className="layout-card-title-row">
                <span className="layout-card-title">Layout 1</span>
                {publishedLayout === "layout_1" ? (
                  <span className="layout-card-active-label">Active</span>
                ) : (
                  <span className="layout-card-draft-label">Draft</span>
                )}
              </div>
              <p className="layout-card-description">
                Standard layout displaying a statistics grid, an always-visible (static) customer review form, and beautiful full-width review cards.
              </p>
            </div>
            <div className="layout-card-buttons-row">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLayout("layout_1");
                  submit({
                    selectedLayout: "layout_1",
                    layoutConfigs: JSON.stringify(layoutConfigs)
                  }, { method: "POST" });
                }}
                className="layout-card-btn-primary"
              >
                Publish
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSelectLayout("layout_1"); }}
                className="layout-card-btn-secondary"
              >
                Customize
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Layout 2 (Streamlined Timeline) */}
        <div
          className={`layout-card ${selectedLayout === "layout_2" ? "active" : ""}`}
          onClick={() => handleSelectLayout("layout_2")}
        >
          <div className="layout-card-preview-banner layout-2-bg">
            <div className="layout-card-mini-canvas">
              <div className="layout-card-mini-title">Customer Reviews (Layout 2)</div>
              {/* Horizontal Summary bar */}
              <div className="mini-summary-row">
                <div className="mini-summary-label" />
                <div className="mini-summary-badge" />
              </div>
              {/* Clean lines */}
              <div className="mini-divider-line" />
              <div className="mini-divider-line" />
            </div>
            {selectedLayout === "layout_2" && (
              <div className="layout-card-check-badge">✓</div>
            )}
          </div>
          <div className="layout-card-details">
            <div>
              <div className="layout-card-title-row">
                <span className="layout-card-title">Layout 2</span>
                {publishedLayout === "layout_2" ? (
                  <span className="layout-card-active-label">Active</span>
                ) : (
                  <span className="layout-card-draft-label">Draft</span>
                )}
              </div>
              <p className="layout-card-description">
                Clean, minimalist list format showing a compact horizontal summary row and a space-saving text timeline feed.
              </p>
            </div>
            <div className="layout-card-buttons-row">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectLayout("layout_2");
                  submit({
                    selectedLayout: "layout_2",
                    layoutConfigs: JSON.stringify(layoutConfigs)
                  }, { method: "POST" });
                }}
                className="layout-card-btn-primary"
              >
                Publish
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSelectLayout("layout_2"); }}
                className="layout-card-btn-secondary"
              >
                Customize
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Raw JSON */}
        <div
          className={`layout-card ${selectedLayout === "raw_data" ? "active" : ""}`}
          onClick={() => {
            handleSelectLayout("raw_data");
            submit({
              selectedLayout: "raw_data",
              layoutConfigs: JSON.stringify(layoutConfigs)
            }, { method: "POST" });
          }}
        >
          <div className="layout-card-preview-banner raw-bg">
            <div className="mini-raw-code">
              {"{"} <br />
              &nbsp;&nbsp;"reviews": [ <br />
              &nbsp;&nbsp;&nbsp;&nbsp;{"{ \"rating\": 5, \"body\": \"Excellent!\" }"} <br />
              &nbsp;&nbsp;] <br />
              {"}"}
            </div>
            {selectedLayout === "raw_data" && (
              <div className="layout-card-check-badge">✓</div>
            )}
          </div>
          <div className="layout-card-details">
            <div>
              <div className="layout-card-title-row">
                <span className="layout-card-title">Raw data</span>
                {publishedLayout === "raw_data" ? (
                  <span className="layout-card-active-label">Active</span>
                ) : (
                  <span className="layout-card-draft-label">Draft</span>
                )}
              </div>
              <p className="layout-card-description">
                Outputs storefront reviews as raw unstyled JSON. Perfect for developers who want to write fully custom CSS or parse reviews via javascript.
              </p>

              {selectedLayout === "raw_data" && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginTop: "1.25rem",
                    padding: "1rem",
                    background: "#f6f6f7",
                    borderRadius: "8px",
                    border: "1px solid #e1e3e5",
                    boxSizing: "border-box"
                  }}
                >
                  {/* --- GET SECTION --- */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        display: "block",
                        marginBottom: "6px",
                        color: "#202223",
                        textAlign: "left"
                      }}
                    >
                      GET: Fetch Reviews API URL
                    </span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <input
                        type="text"
                        readOnly
                        value={apiUrl}
                        style={{
                          flex: 1,
                          fontSize: "0.8rem",
                          background: "white",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #babfc3",
                          fontFamily: "monospace",
                          color: "#202223",
                          outline: "none"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(apiUrl);
                          shopify.toast.show("GET URL copied");
                        }}
                        style={{
                          padding: "8px 16px",
                          background: "#202223",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#6d7175", lineHeight: "1.4", textAlign: "left" }}>
                      Replace the <code>[PRODUCT_ID]</code> parameter with the Shopify Product ID or GID to fetch reviews dynamically.
                    </p>
                  </div>

                  {/* --- POST SECTION --- */}
                  <div style={{ borderTop: "1px solid #e1e3e5", paddingTop: "1.25rem" }}>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        display: "block",
                        marginBottom: "6px",
                        color: "#202223",
                        textAlign: "left"
                      }}
                    >
                      POST: Submit Review API URL
                    </span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <input
                        type="text"
                        readOnly
                        value={postUrl}
                        style={{
                          flex: 1,
                          fontSize: "0.8rem",
                          background: "white",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #babfc3",
                          fontFamily: "monospace",
                          color: "#202223",
                          outline: "none"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(postUrl);
                          shopify.toast.show("POST URL copied");
                        }}
                        style={{
                          padding: "8px 16px",
                          background: "#202223",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        display: "block",
                        marginTop: "8px",
                        marginBottom: "4px",
                        color: "#202223",
                        textAlign: "left"
                      }}
                    >
                      Required Form-Data Keys (POST Body):
                    </span>
                    <div
                      style={{
                        background: "white",
                        border: "1px solid #e1e3e5",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "0.78rem",
                        textAlign: "left",
                        lineHeight: "1.5",
                        fontFamily: "monospace",
                        color: "#4a4a4a"
                      }}
                    >
                      <div><strong>productId</strong>: [PRODUCT_ID]</div>
                      <div><strong>shop</strong>: {shop || "demoharsh-1dds80q1.myshopify.com"}</div>
                      <div><strong>rating</strong>: 5</div>
                      <div><strong>reviewerName</strong>: Will Smith</div>
                      <div><strong>reviewerEmail</strong>: will@example.com</div>
                      <div><strong>reviewTitle</strong>: Excellent!</div>
                      <div><strong>reviewBody</strong>: Loved this product.</div>
                      <div><strong>image</strong>: [optional file upload]</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectLayout("raw_data");
                submit({
                  selectedLayout: "raw_data",
                  layoutConfigs: JSON.stringify(layoutConfigs)
                }, { method: "POST" });
              }}
              className="layout-card-btn raw-btn"
            >
              Set as Active Raw data
            </button>
          </div>
        </div>
      </div>
    </s-page>
  );
}
