import PreviewStarRating from "./PreviewStarRating";

export default function PreviewReviewCard({
  reviewerName,
  rating,
  dateStr,
  reviewTitle,
  reviewBody,
  imageUrl,
  imageUrls = [],
  style = {},
  isCarousel = false,
  imageCarouselConfig,
  previewDevice
}) {
  const getAvatarColors = (name) => {
    const len = name ? name.length : 0;
    const index = len % 6;
    const palettes = [
      { bg: "#E3F2FD", fg: "#1E88E5" }, // Blue
      { bg: "#F3E5F5", fg: "#8E24AA" }, // Purple
      { bg: "#E8F5E9", fg: "#43A047" }, // Green
      { bg: "#FFF3E0", fg: "#FB8C00" }, // Orange
      { bg: "#FFEBEE", fg: "#E53935" }, // Red
      { bg: "#E0F7FA", fg: "#00ACC1" }  // Cyan
    ];
    return palettes[index];
  };

  const nameColors = getAvatarColors(reviewerName);
  const firstLetter = reviewerName ? reviewerName.charAt(0).toUpperCase() : "?";

  // Helper to render multiple images below body text
  const renderImages = () => {
    const list = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
    if (list.length === 0) return null;

    const imgVisibleSlides = imageCarouselConfig?.visibleSlides ?? 4;
    const imgGap = 8;
    const imgWidth = `calc((100% - ${(imgVisibleSlides - 1) * imgGap}px) / ${imgVisibleSlides})`;

    return (
      <div style={{ position: "relative", marginTop: "10px" }}>
        <div 
          className="preview-review-images" 
          style={{ 
            display: "flex", 
            gap: `${imgGap}px`, 
            overflowX: "hidden", 
            padding: "4px 0"
          }}
        >
          {list.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Attached review ${i}`}
              style={{
                width: imgWidth,
                height: isCarousel ? "45px" : "65px",
                borderRadius: "6px",
                objectFit: "cover",
                border: "1px solid #e1e3e5",
                flexShrink: 0
              }}
            />
          ))}
        </div>
        {imageCarouselConfig?.showArrows && list.length > imgVisibleSlides && (
          <div style={{ display: "flex", gap: "6px", marginTop: "4px", justifyContent: "flex-end" }}>
            <button style={{ border: "1px solid #babfc3", background: "white", padding: "1px 5px", fontSize: "0.7rem", borderRadius: "3px", cursor: "pointer", color: "#6d7175" }}>&lt;</button>
            <button style={{ border: "1px solid #babfc3", background: "white", padding: "1px 5px", fontSize: "0.7rem", borderRadius: "3px", cursor: "pointer", color: "#6d7175" }}>&gt;</button>
          </div>
        )}
      </div>
    );
  };

  if (isCarousel) {
    return (
      <div
        className="review-carousel-card"
        style={{
          flexShrink: 0,
          border: "1px solid #e1e3e5",
          borderRadius: "12px",
          padding: "1.25rem",
          background: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          ...style
        }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: nameColors.bg,
                color: nameColors.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "0.8rem",
                flexShrink: 0
              }}>
                {firstLetter}
              </div>
              <span style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#1a1a1a" }}>{reviewerName}</span>
              <span style={{ background: "#e3f1df", color: "#0e6216", fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>Verified</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#6d7175" }}>{dateStr}</span>
          </div>
          
          <PreviewStarRating
            rating={rating}
            style={{ color: "var(--star-color)", fontSize: "0.85rem", letterSpacing: "1px", marginBottom: "8px" }}
          />

          {reviewTitle && (
            <h5 style={{ fontWeight: "bold", fontSize: "0.95rem", margin: "0 0 4px 0", color: "#1a1a1a" }}>{reviewTitle}</h5>
          )}
          <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#4a4a4a", lineHeight: "1.4" }}>{reviewBody}</p>
          
          {renderImages()}
        </div>
      </div>
    );
  }

  // Standard full-width review card for Layout 1
  return (
    <div className="preview-review-card" style={style}>
      <div className="preview-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: nameColors.bg,
            color: nameColors.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "0.95rem",
            flexShrink: 0
          }}>
            {firstLetter}
          </div>
          <div>
            <h4 className="preview-reviewer-name" style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#1a1a1a" }}>{reviewerName}</h4>
            <PreviewStarRating
              rating={rating}
              style={{ color: "var(--star-color)", fontSize: "0.9rem", letterSpacing: "1px", display: "flex", marginTop: "4px" }}
            />
          </div>
        </div>
        <span className="preview-review-date" style={{ fontSize: "0.8rem", color: "#6d7175" }}>{dateStr}</span>
      </div>
      {reviewTitle && (
        <h5 style={{ fontWeight: "bold", fontSize: "0.98rem", margin: "0 0 6px 0", color: "#1a1a1a" }}>{reviewTitle}</h5>
      )}
      <p className="preview-review-body" style={{ fontSize: "0.95rem", lineHeight: "1.5", color: "#2b2b2b", margin: "0 0 12px 0" }}>{reviewBody}</p>
      {renderImages()}
    </div>
  );
}
