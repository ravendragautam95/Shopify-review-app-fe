import PreviewFormCard from "./PreviewFormCard";
import PreviewReviewCard from "./PreviewReviewCard";
import PreviewStarRating from "./PreviewStarRating";

export default function LivePreview({
  selectedLayout,
  currentConfig,
  previewDevice,
  setPreviewDevice,
  handlePublish,
  isPublishing
}) {
  const desktopSlides = currentConfig.carousel_desktop_slides ?? 3;
  const mobileSlides = currentConfig.carousel_mobile_slides ?? 1;
  const showArrows = currentConfig.carousel_show_arrows ?? true;

  const visibleSlides = previewDevice === "desktop" ? desktopSlides : mobileSlides;
  const gap = previewDevice === "desktop" ? 15 : 12;
  const cardWidth = `calc((100% - ${(visibleSlides - 1) * gap}px) / ${visibleSlides})`;

  const imgVisibleSlides = previewDevice === "desktop"
    ? (currentConfig.image_carousel_desktop_slides ?? 4)
    : (currentConfig.image_carousel_mobile_slides ?? 2);

  const imageCarouselConfig = {
    visibleSlides: imgVisibleSlides,
    showArrows: currentConfig.image_carousel_show_arrows ?? true
  };

  // Review Word singular/plural helper
  const getReviewWord = (count) => {
    return count === 1
      ? currentConfig.review_word_singular || "review"
      : currentConfig.review_word_plural || "reviews";
  };

  return (
    <div className="preview-area">
      {/* Preview Top Header Bar */}
      <div className="preview-header-bar">
        <div className="previewing-badge-wrap">
          <span className="previewing-label">Previewing</span>
          <div className="preview-select-badge">
            Sample data ▾
          </div>
        </div>

        {/* Right controls: Device Toggle + Publish button */}
        <div className="preview-right-controls">
          {/* Desktop / Mobile Device Toggle */}
          <div className="device-toggle-wrap">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`device-toggle-btn ${previewDevice === "desktop" ? "active" : ""}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`device-toggle-btn ${previewDevice === "mobile" ? "active" : ""}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12" y2="18"></line>
              </svg>
              Mobile
            </button>
          </div>

          {/* Publish Settings Button */}
          {(selectedLayout === "layout_1" || selectedLayout === "layout_2") && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="publish-settings-btn"
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>

      {/* Preview Canvas Container */}
      <div className="preview-canvas">
        {/* Simulated Page Container */}
        <div className={`simulated-page ${previewDevice === "desktop" ? "desktop" : "mobile"}`}>

          {/* --- LIVE PREVIEW: LAYOUT 1 (STANDARD W/ STATIC FORM) --- */}
          {selectedLayout === "layout_1" && (
            <div style={{ textAlign: "left" }}>
              {/* Header Title */}
              {currentConfig.show_widget_title && (
                <h2 className="preview-title">
                  {currentConfig.heading_text}
                </h2>
              )}

              {/* Summary Box & Stats Grid */}
              <div className={`preview-summary-grid ${previewDevice === "desktop" ? "desktop" : "mobile"}`}>
                {/* Left score details */}
                <div className={`preview-avg-box ${previewDevice === "desktop" ? "desktop" : ""}`}>
                  <div className="preview-avg-val">4.1</div>
                  <PreviewStarRating
                    rating={4.1}
                    style={{ color: "var(--star-color, #ffb800)", fontSize: "1.2rem", margin: "4px 0" }}
                  />
                  <div className="preview-avg-count">15 {getReviewWord(15)}</div>
                </div>

                {/* Right bar distributions */}
                <div className="preview-dist-list">
                  {[
                    { s: "5 star", w: "70%" },
                    { s: "4 star", w: "15%" },
                    { s: "3 star", w: "10%" },
                    { s: "2 star", w: "5%" },
                    { s: "1 star", w: "0%" }
                  ].map((row, idx) => (
                    <div key={idx} className="preview-dist-row">
                      <span className="preview-dist-label">{row.s}</span>
                      <div className="preview-dist-bar-bg">
                        <div className="preview-dist-bar-fill" style={{ width: row.w }} />
                      </div>
                      <span className="preview-dist-pct">{row.w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* STATIC CUSTOMER REVIEW FORM (ALWAYS VISIBLE FOR LAYOUT 1 PREVIEW!) */}
              <PreviewFormCard />

              {/* Media list horizontal scroll simulator */}
              <div className="preview-media-list" style={{ marginTop: "1.5rem" }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="preview-media-item">
                    <div className="preview-media-icon">📸</div>
                  </div>
                ))}
              </div>

              {/* Review cards list */}
              <div className="preview-feed-list">
                <PreviewReviewCard
                  reviewerName="Emily R."
                  rating={5}
                  dateStr="August 18, 2025 at 11:05 AM IST"
                  reviewTitle="Perfect Sweater"
                  reviewBody="This sweater exceeded all my expectations. It's thick enough to keep me warm during cold days but still breathable. The material is soft."
                  imageUrls={[
                    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=120",
                    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=120"
                  ]}
                  imageCarouselConfig={imageCarouselConfig}
                  previewDevice={previewDevice}
                />

                <PreviewReviewCard
                  reviewerName="John D."
                  rating={4}
                  dateStr="August 17, 2025 at 08:30 PM IST"
                  reviewTitle="Great Quality"
                  reviewBody="Great quality and fit. True to size. Excellent wool weave structure!"
                />
              </div>
            </div>
          )}

          {/* --- LIVE PREVIEW: LAYOUT 2 (CAROUSEL THEME) --- */}
          {selectedLayout === "layout_2" && (
            <div style={{ textAlign: "left" }}>
              {/* Header Title */}
              {currentConfig.show_widget_title && (
                <h2 className="preview-title">
                  {currentConfig.heading_text}
                </h2>
              )}

              {/* Summary Row (exactly matching screenshot) */}
              <div className="preview-carousel-summary-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", borderBottom: "1px solid #e1e3e5", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1a1a1a", lineHeight: 1 }}>4.1</span>
                  <PreviewStarRating
                    rating={4.1}
                    style={{ color: "var(--star-color)", fontSize: "1rem", letterSpacing: "1px" }}
                  />
                  <span style={{ fontSize: "0.9rem", color: "#6d7175" }}>15 {getReviewWord(15)}</span>
                  <span className="preview-form-alert" style={{ margin: 0, padding: "3px 8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    ✓ Verified
                  </span>

                  {/* Stamp badges */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px double #d2a100", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", color: "#d2a100", fontWeight: "bold", background: "#fffdf0" }}>GOLD</div>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px double #8e8e8e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", color: "#8e8e8e", fontWeight: "bold", background: "#fcfcfc" }}>SLVR</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Write review button */}
                  <button className="preview-submit-btn" style={{ margin: 0, padding: "8px 18px", fontSize: "0.88rem" }}>
                    {currentConfig.button_text}
                  </button>
                  {/* Action buttons (funnel and sort icons) */}
                  <button style={{ background: "none", border: "1px solid #babfc3", borderRadius: "6px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.9rem", color: "#6d7175" }}>
                    🔍
                  </button>
                  <button style={{ background: "none", border: "1px solid #babfc3", borderRadius: "6px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.9rem", color: "#6d7175" }}>
                    ⇅
                  </button>
                </div>
              </div>

              {/* STATIC CUSTOMER REVIEW FORM (ALWAYS VISIBLE FOR LAYOUT 2 PREVIEW!) */}
              <PreviewFormCard style={{ marginBottom: "1.5rem" }} />

              {/* Horizontal Reviews Carousel Section */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: `${gap}px`, overflowX: "hidden", padding: "10px 0" }}>
                  <PreviewReviewCard
                    reviewerName="Noah V."
                    rating={4}
                    dateStr="08/15/2025"
                    reviewTitle="Runs small"
                    reviewBody="(Sample review) Too tight."
                    isCarousel={true}
                    style={{ width: cardWidth }}
                  />

                  <PreviewReviewCard
                    reviewerName="Aline D."
                    rating={5}
                    dateStr="08/15/2025"
                    reviewTitle="Très chaud et doux"
                    reviewBody="(Sample review) This sweater is incredibly warm, thick, and premium wool."
                    isCarousel={true}
                    style={{ width: cardWidth }}
                  />

                  <PreviewReviewCard
                    reviewerName="Emily R."
                    rating={5}
                    dateStr="08/14/2025"
                    reviewTitle="Perfect Sweater"
                    reviewBody="Exceeded all my expectations. The weave and stitching is absolutely premium."
                    imageUrls={[
                      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=120",
                      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=120"
                    ]}
                    isCarousel={true}
                    style={{ width: cardWidth }}
                    imageCarouselConfig={imageCarouselConfig}
                    previewDevice={previewDevice}
                  />
                </div>

                {/* Reviews Carousel navigation arrows */}
                {showArrows && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "12px" }}>
                    <button style={{ background: "none", border: "1px solid #babfc3", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                      &lt;
                    </button>
                    <button style={{ background: "none", border: "1px solid #babfc3", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                      &gt;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
