import { useState, useEffect } from "react";
import { Form, useLoaderData, useActionData, useNavigation, useSubmit, useFetcher } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import "../styles/importexport.css";

// Robust CSV Parser that handles double quotes, commas, and newlines inside fields
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" represents a single double quote inside quotes
        row[row.length - 1] += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Move to next column
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  
  return lines;
}

// Loader gathers total reviews and products with reviews for the summary dashboard
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  let totalReviews = 0;
  let totalProductsWithReviews = 0;

  try {
    const query = `#graphql
      query getProducts($cursor: String) {
        products(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            metafield(namespace: "reviews_app", key: "reviews_list") {
              value
            }
          }
        }
      }
    `;

    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const response = await admin.graphql(query, { variables: { cursor } });
      const json = await response.json();
      const products = json.data?.products?.nodes || [];

      for (const product of products) {
        const metafieldValue = product.metafield?.value;
        if (metafieldValue) {
          try {
            const reviews = JSON.parse(metafieldValue);
            if (Array.isArray(reviews) && reviews.length > 0) {
              totalReviews += reviews.length;
              totalProductsWithReviews += 1;
            }
          } catch (e) {}
        }
      }

      hasNextPage = json.data?.products?.pageInfo?.hasNextPage || false;
      cursor = json.data?.products?.pageInfo?.endCursor || null;
    }
  } catch (error) {
    console.error("Loader error in import/export reviews:", error);
  }

  return { totalReviews, totalProductsWithReviews };
};

// Action handles Export CSV, Download Template CSV, and Import CSV uploads
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = String(formData.get("actionType") ?? "");

  // --- ACTION CASE 1: DOWNLOAD CSV TEMPLATE ---
  if (actionType === "download_template") {
    const templateCsv = "title,body,rating,review_date,reviewer_name,reviewer_email,product_id,product_handle,reply,picture_urls\n" +
                        "Perfect Sweater,Loved this wool winter sweater! Extremely warm and soft.,5,2025-08-14T11:05:00Z,Emily R.,emily@example.com,,winter-sweater,,\n" +
                        "Great Fit,Very thick weave structure. Fit is excellent.,4,2025-08-17T20:30:00Z,John D.,john@example.com,,winter-sweater,,\n";

    return {
      success: true,
      isDownload: true,
      csvContent: templateCsv,
      filename: "reviews_import_template.csv",
      downloadId: Date.now()
    };
  }

  // --- ACTION CASE 2: EXPORT ALL STORE REVIEWS ---
  if (actionType === "export") {
    try {
      const csvRows = [
        ["Product GID", "Product Title", "Product Handle", "Review ID", "Reviewer Name", "Reviewer Email", "Rating", "Title", "Body", "Image URL", "Created At"]
      ];

      const query = `#graphql
        query getProducts($cursor: String) {
          products(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              handle
              metafield(namespace: "reviews_app", key: "reviews_list") {
                value
              }
            }
          }
        }
      `;

      let hasNextPage = true;
      let cursor = null;

      while (hasNextPage) {
        const response = await admin.graphql(query, { variables: { cursor } });
        const json = await response.json();
        const products = json.data?.products?.nodes || [];

        for (const product of products) {
          const metafieldValue = product.metafield?.value;
          if (metafieldValue) {
            try {
              const reviews = JSON.parse(metafieldValue);
              if (Array.isArray(reviews)) {
                for (const r of reviews) {
                  csvRows.push([
                    product.id,
                    product.title,
                    product.handle,
                    r.id || "",
                    r.name || "",
                    r.email || "",
                    r.rating || 5,
                    r.title || "",
                    r.body || "",
                    r.imageUrl || "",
                    r.createdAt || ""
                  ]);
                }
              }
            } catch (e) {}
          }
        }

        hasNextPage = json.data?.products?.pageInfo?.hasNextPage || false;
        cursor = json.data?.products?.pageInfo?.endCursor || null;
      }

      // Convert arrays to CSV strings safely escaping quotes
      const csvContent = csvRows.map(row => 
        row.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")
      ).join("\n");

      return {
        success: true,
        isDownload: true,
        csvContent: csvContent,
        filename: "shopify_store_reviews_export.csv",
        downloadId: Date.now()
      };
    } catch (err) {
      console.error("Export reviews error:", err);
      return { success: false, error: "Failed to compile reviews for export: " + err.message };
    }
  }

  // --- ACTION CASE 3: IMPORT REVIEWS FROM CSV FILE ---
  if (actionType === "import") {
    const file = formData.get("csvFile");
    if (!file || typeof file !== "object" || file.size === 0) {
      return { success: false, error: "Please choose a valid CSV file to upload." };
    }

    try {
      const csvText = await file.text();
      const rows = parseCSV(csvText);

      if (rows.length <= 1) {
        return { success: false, error: "The selected CSV file has no records to import." };
      }

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const titleIdx = headers.indexOf("title");
      const bodyIdx = headers.indexOf("body");
      const ratingIdx = headers.indexOf("rating");
      const dateIdx = headers.indexOf("review_date");
      const nameIdx = headers.indexOf("reviewer_name");
      const emailIdx = headers.indexOf("reviewer_email");
      const handleIdx = headers.indexOf("product_handle");
      const imageIdx = headers.indexOf("picture_urls");

      if (handleIdx === -1 || ratingIdx === -1 || nameIdx === -1 || bodyIdx === -1) {
        return { 
          success: false, 
          error: "CSV headers are missing required columns. Make sure you include: product_handle, rating, reviewer_name, body" 
        };
      }

      let importCount = 0;
      let errorCount = 0;
      const customerErrors = [];

      // ── Helper: generate a sanitized email slug from a name ──────────────
      const emailFromName = (name) => {
        const slug = (name || "reviewer")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ".")   // replace non-alphanumeric with dot
          .replace(/\.{2,}/g, ".")       // collapse consecutive dots
          .replace(/^\.|\.$/, "");       // strip leading/trailing dots
        return `${slug || "reviewer"}@imported.reviews`;
      };

      // ── Helper: ensure a Shopify customer exists for the given email ──────
      // Returns the final email used (may match an existing customer).
      const ensureShopifyCustomer = async (name, email) => {
        const firstName = name.split(" ")[0] || "Reviewer";
        const lastName  = name.split(" ").slice(1).join(" ") || "(Imported)";

        const createMutation = `#graphql
          mutation customerCreate($input: CustomerInput!) {
            customerCreate(input: $input) {
              userErrors {
                field
                message
              }
            }
          }
        `;

        try {
          const res = await admin.graphql(createMutation, {
            variables: {
              input: {
                firstName,
                lastName,
                email,
                tags: ["review-importer"]
              }
            }
          });
          const json = await res.json();
          const errors = json.data?.customerCreate?.userErrors || [];

          // If the only error is "Email has already been taken" the customer
          // already exists — that's fine, we still use the email.
          const fatalErrors = errors.filter(
            e => !e.message?.toLowerCase().includes("already been taken")
          );
          if (fatalErrors.length > 0) {
            fatalErrors.forEach(err => {
              customerErrors.push(`${name} (${email}): ${err.message}`);
            });
            console.warn("[Import] customerCreate errors:", fatalErrors);
          }
        } catch (e) {
          customerErrors.push(`${name} (${email}): Exception - ${e.message}`);
          console.warn("[Import] customerCreate exception:", e.message);
        }

        return email;
      };

      // Group CSV rows by product handle to batch database operations
      const groupedReviews = {};
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length || !row[handleIdx]?.trim()) continue;

        const handle = row[handleIdx].trim();
        if (!groupedReviews[handle]) {
          groupedReviews[handle] = [];
        }

        const reviewerName  = row[nameIdx]?.trim() || "Anonymous";
        let   reviewerEmail = emailIdx !== -1 ? row[emailIdx]?.trim() : "";

        // ── Always check and create the customer in Shopify
        if (!reviewerEmail) {
          reviewerEmail = emailFromName(reviewerName);
        }
        reviewerEmail = await ensureShopifyCustomer(reviewerName, reviewerEmail);

        groupedReviews[handle].push({
          rating:    parseInt(row[ratingIdx], 10) || 5,
          name:      reviewerName,
          email:     reviewerEmail,
          title:     titleIdx !== -1 ? row[titleIdx]?.trim() : "",
          body:      row[bodyIdx]?.trim() || "",
          imageUrl:  imageIdx !== -1 ? row[imageIdx]?.trim() : "",
          createdAt: dateIdx !== -1 && row[dateIdx]?.trim()
            ? new Date(row[dateIdx]).toISOString()
            : new Date().toISOString()
        });
      }

      // Process imports product by product
      for (const [handle, newReviews] of Object.entries(groupedReviews)) {
        try {
          // 1. Look up the product details by handle
          const productQuery = `#graphql
            query getProduct($handle: String!) {
              productByHandle(handle: $handle) {
                id
                metafield(namespace: "reviews_app", key: "reviews_list") {
                  value
                }
              }
            }
          `;
          const prodResponse = await admin.graphql(productQuery, { variables: { handle } });
          const prodJson = await prodResponse.json();
          const product = prodJson.data?.productByHandle;

          if (!product) {
            errorCount += newReviews.length;
            continue;
          }

          // 2. Extract existing reviews list
          let reviews = [];
          const metafieldValue = product.metafield?.value;
          if (metafieldValue) {
            try {
              reviews = JSON.parse(metafieldValue);
            } catch (e) {}
          }

          // 3. Append the new reviews with unique IDs
          for (const item of newReviews) {
            reviews.unshift({
              id: crypto.randomUUID(),
              name: item.name,
              email: item.email,
              rating: item.rating,
              title: item.title,
              body: item.body,
              imageUrl: item.imageUrl,
              createdAt: item.createdAt
            });
            importCount++;
          }

          // 4. Write back to product metafield
          const setMutation = `#graphql
            mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          const setResponse = await admin.graphql(setMutation, {
            variables: {
              metafields: [
                {
                  ownerId: product.id,
                  namespace: "reviews_app",
                  key: "reviews_list",
                  type: "json",
                  value: JSON.stringify(reviews)
                }
              ]
            }
          });
          
          const setJson = await setResponse.json();
          const errors = setJson.data?.metafieldsSet?.userErrors || [];
          if (errors.length > 0) {
            errorCount += newReviews.length;
            importCount -= newReviews.length;
          }

        } catch (err) {
          errorCount += newReviews.length;
        }
      }

      return { success: true, importCount, errorCount, customerErrors };

    } catch (err) {
      console.error("Import reviews error:", err);
      return { success: false, error: "An error occurred during file parsing: " + err.message };
    }
  }

  return null;
};

export default function ImportExportReviews() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const downloadFetcher = useFetcher();
  const [selectedFile, setSelectedFile] = useState(null);
  const [lastDownloadedId, setLastDownloadedId] = useState(null);

  const isExporting = downloadFetcher.state !== "idle" && downloadFetcher.formData?.get("actionType") === "export";
  const isDownloadingTemplate = downloadFetcher.state !== "idle" && downloadFetcher.formData?.get("actionType") === "download_template";
  const isImporting = navigation.state === "submitting" && navigation.formData?.get("actionType") === "import";

  // Show Toast notifications upon action completion
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        if (actionData.importCount !== undefined) {
          shopify.toast.show(
            `Import complete: ${actionData.importCount} reviews added, ${actionData.errorCount} errors.`
          );
          setSelectedFile(null);
          // Reset file input element
          const fileInput = document.getElementById("csvFile");
          if (fileInput) fileInput.value = "";
        }
      } else if (actionData.error) {
        shopify.toast.show(actionData.error);
      }
    }
  }, [actionData, shopify]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle programmatic downloads from fetcher
  useEffect(() => {
    const data = downloadFetcher.data;
    if (data?.isDownload && data?.csvContent && data?.downloadId !== lastDownloadedId) {
      setLastDownloadedId(data.downloadId);
      try {
        const blob = new Blob([data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "export.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        shopify.toast.show("Download started");
      } catch (err) {
        console.error("Download trigger error:", err);
        shopify.toast.show("Failed to trigger download");
      }
    }
  }, [downloadFetcher.data, lastDownloadedId, shopify]);

  // Show Toast notifications upon download action error
  useEffect(() => {
    if (downloadFetcher.data && !downloadFetcher.data.success && downloadFetcher.data.error) {
      shopify.toast.show(downloadFetcher.data.error);
    }
  }, [downloadFetcher.data, shopify]);

  const handleExport = () => {
    downloadFetcher.submit({ actionType: "export" }, { method: "POST" });
  };

  const handleDownloadTemplate = () => {
    downloadFetcher.submit({ actionType: "download_template" }, { method: "POST" });
  };

  return (
    <s-page heading="Import & Export Reviews" back-link="/app/settings">
      {/* Hero Welcome Banner */}
      <div className="importexport-hero">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.01em" }}>
          Reviews Migration Center
        </h1>
        <p style={{ margin: 0, fontSize: "0.92rem", color: "#94a3b8", lineHeight: "1.6" }}>
          Migrate your store reviews seamlessly. Export all existing customer feedback to a unified backup CSV spreadsheet or import bulk reviews from other platforms.
        </p>
      </div>

      {/* Overview Statistics Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-reviews">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Store Reviews</span>
            <span className="stat-value">{loaderData?.totalReviews ?? 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-products">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Products with Reviews</span>
            <span className="stat-value">{loaderData?.totalProductsWithReviews ?? 0}</span>
          </div>
        </div>
      </div>

      <s-section heading="Operations">
        <s-stack direction="block" gap="large">
          
          {/* EXPORT SECTION CARD */}
          <div className="operation-card">
            <div className="operation-title-wrapper">
              <svg className="operation-title-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <h3 className="operation-title">Export Reviews</h3>
            </div>
            <p className="operation-description">
              Download all product reviews across your entire store into a single CSV spreadsheet file. You can use this file as a backup or to migrate reviews to another account.
            </p>
            <s-button
              variant="primary"
              type="button"
              onClick={handleExport}
              {...(isExporting ? { disabled: true } : {})}
            >
              {isExporting ? "Exporting..." : "Export All Reviews (CSV)"}
            </s-button>
          </div>

          {/* IMPORT SECTION CARD */}
          <div className="operation-card">
            <div className="operation-title-wrapper">
              <svg className="operation-title-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <h3 className="operation-title">Import Reviews</h3>
            </div>
            <p className="operation-description">
              Upload a bulk CSV file to import ratings and reviews directly onto your products. The spreadsheet must match our schema columns.
            </p>

            {/* Display success banner after import */}
            {actionData?.success && actionData.importCount !== undefined && (
              <div style={{ background: "#e3f1df", border: "1px solid #ccebd1", borderRadius: "8px", padding: "1rem", color: "#0e6216", fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: "1.4" }}>
                <strong>Successfully imported: {actionData.importCount} reviews!</strong>
                {actionData.errorCount > 0 && (
                  <span style={{ display: "block", marginTop: "4px", color: "#b95000" }}>
                    ⚠️ {actionData.errorCount} reviews could not be imported because their product handles were not found or their records were malformed.
                  </span>
                )}
                {actionData.customerErrors && actionData.customerErrors.length > 0 && (
                  <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #d4e7d0", color: "#b95000", fontSize: "0.82rem" }}>
                    <strong>Customer Sync Notices:</strong>
                    <ul style={{ margin: "5px 0 0 15px", padding: 0 }}>
                      {actionData.customerErrors.map((err, idx) => (
                        <li key={idx} style={{ marginTop: "2px" }}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* File upload form */}
            <Form method="post" encType="multipart/form-data">
              <input type="hidden" name="actionType" value="import" />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
                <label htmlFor="csvFile" style={{ fontSize: "0.85rem", fontWeight: "600", color: "#2c2e30" }}>
                  Select CSV File
                </label>
                
                <div className="file-upload-area">
                  <svg className="upload-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <div className="upload-text">
                    {selectedFile ? `Selected: ${selectedFile.name}` : "Click to select your reviews CSV file"}
                  </div>
                  <div className="upload-hint">
                    {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "Supports standard CSV files matching our schema"}
                  </div>
                  <input
                    type="file"
                    id="csvFile"
                    name="csvFile"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="file-upload-input"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <s-button variant="primary" type="submit" {...(isImporting || !selectedFile ? { disabled: true } : {})} {...(isImporting ? { loading: true } : {})}>
                  {isImporting ? "Importing..." : "Upload and Import"}
                </s-button>
                
                <s-button
                  variant="secondary"
                  type="button"
                  onClick={handleDownloadTemplate}
                  {...(isDownloadingTemplate ? { disabled: true } : {})}
                >
                  {isDownloadingTemplate ? "Downloading..." : "Download Sample CSV Template"}
                </s-button>
              </div>
            </Form>
          </div>

        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Required CSV Columns">
        <s-paragraph>
          Your import CSV spreadsheet must contain the following header column names exactly:
        </s-paragraph>
        
        <div className="sidebar-columns-list">
          <div className="column-row">
            <div className="column-header">
              <span className="column-name">product_handle</span>
              <span className="column-req-badge req-badge-required">Required</span>
            </div>
            <p className="column-desc">The Shopify product handle slug (e.g. <code>winter-sweater</code>).</p>
          </div>

          <div className="column-row">
            <div className="column-header">
              <span className="column-name">rating</span>
              <span className="column-req-badge req-badge-required">Required</span>
            </div>
            <p className="column-desc">A numeric rating from 1 to 5.</p>
          </div>

          <div className="column-row">
            <div className="column-header">
              <span className="column-name">reviewer_name</span>
              <span className="column-req-badge req-badge-required">Required</span>
            </div>
            <p className="column-desc">Customer's display name for the review.</p>
          </div>

          <div className="column-row">
            <div className="column-header">
              <span className="column-name">body</span>
              <span className="column-req-badge req-badge-required">Required</span>
            </div>
            <p className="column-desc">The main text content of the review.</p>
          </div>

          <div className="column-row">
            <div className="column-header">
              <span className="column-name">reviewer_email</span>
              <span className="column-req-badge req-badge-optional">Optional</span>
            </div>
            <p className="column-desc">Customer's email address.</p>
          </div>

          <div className="column-row">
            <div className="column-header">
              <span className="column-name">title</span>
              <span className="column-req-badge req-badge-optional">Optional</span>
            </div>
            <p className="column-desc">Review headline or title.</p>
          </div>

          <div className="column-row">
            <div className="column-header">
              <span className="column-name">image_url</span>
              <span className="column-req-badge req-badge-optional">Optional</span>
            </div>
            <p className="column-desc">URL of an attached review photo.</p>
          </div>

          <div className="column-row">
            <div className="column-header">
              <span className="column-name">created_at</span>
              <span className="column-req-badge req-badge-optional">Optional</span>
            </div>
            <p className="column-desc">Custom creation timestamp.</p>
          </div>
        </div>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
