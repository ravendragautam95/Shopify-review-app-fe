import { useAppBridge } from "@shopify/app-bridge-react";
import AccordionItem from "./AccordionItem";

export default function SettingsSidebar({
  selectedLayout,
  currentConfig,
  updateCurrentConfig,
  openAccordion,
  setOpenAccordion,
  themeEditorUrl,
  handleSave,
  isSaving,
  setActiveView,
  publishedLayout
}) {
  const shopify = useAppBridge();

  const handleToggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? "" : id);
  };

  return (
    <div className="sidebar-panel">
      {/* Sidebar Header with back arrow */}
      <div className="sidebar-header">
        <button
          onClick={() => setActiveView("select-layout")}
          className="back-arrow-btn"
        >
          ←
        </button>
        <span className="widget-title-text">
          Review Widget
        </span>
        <span className="layout-badge">
          {selectedLayout === "layout_1" ? "Layout 1" : "Layout 2"}
        </span>
        {/* {publishedLayout === selectedLayout ? (
          <span className="layout-card-active-label">Active</span>
        ) : (
          <span className="layout-card-draft-label">Draft</span>
        )} */}
      </div>

      {/* Sidebar Scrollable Sections */}
      <div className="scrollable-sections">
        {/* Install Accordion */}
        <AccordionItem
          id="install"
          title="Install"
          isOpen={openAccordion === "install"}
          onToggle={() => handleToggleAccordion("install")}
        >
          <div className="install-links-container">
            <p className="install-notes-text">
              Add the Review Widget on product pages.
            </p>
            <div className="install-buttons-row">
              <a
                href={themeEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="install-btn-primary"
              >
                Install ↗
              </a>
              <button
                onClick={() => shopify.toast.show("Check the block in your theme under product templates.")}
                className="install-btn-secondary"
              >
                Learn more
              </button>
            </div>
            <p className="install-subnotes-text">
              Set fallback states for products with no reviews, show store reviews, and more in the Theme Editor settings. &gt;
            </p>
          </div>
        </AccordionItem>

        {/* Color and styling Accordion */}
        <AccordionItem
          id="styling"
          title="Color and styling"
          isOpen={openAccordion === "styling"}
          onToggle={() => handleToggleAccordion("styling")}
        >
          <div className="color-group-container">
            <div>
              <label className="color-group-label">
                Star Rating Color
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={currentConfig.star_color}
                  onChange={(e) => updateCurrentConfig("star_color", e.target.value)}
                  className="color-input-picker"
                />
                <input
                  type="text"
                  value={currentConfig.star_color}
                  onChange={(e) => updateCurrentConfig("star_color", e.target.value)}
                  className="color-input-text"
                />
              </div>
            </div>

            <div>
              <label className="color-group-label">
                Primary Button Color
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={currentConfig.button_color}
                  onChange={(e) => updateCurrentConfig("button_color", e.target.value)}
                  className="color-input-picker"
                />
                <input
                  type="text"
                  value={currentConfig.button_color}
                  onChange={(e) => updateCurrentConfig("button_color", e.target.value)}
                  className="color-input-text"
                />
              </div>
            </div>

            <div>
              <label className="color-group-label">
                Primary Button Text Color
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={currentConfig.button_text_color}
                  onChange={(e) => updateCurrentConfig("button_text_color", e.target.value)}
                  className="color-input-picker"
                />
                <input
                  type="text"
                  value={currentConfig.button_text_color}
                  onChange={(e) => updateCurrentConfig("button_text_color", e.target.value)}
                  className="color-input-text"
                />
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Text Accordion */}
        <AccordionItem
          id="text"
          title="Text"
          isOpen={openAccordion === "text"}
          onToggle={() => handleToggleAccordion("text")}
        >
          <div className="text-fields-container">
            <div style={{ marginBottom: "6px" }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={currentConfig.show_widget_title}
                  onChange={(e) => updateCurrentConfig("show_widget_title", e.target.checked)}
                />
                <span>Show widget title</span>
              </label>
            </div>

            <div>
              <label className="text-field-label">
                Widget title
              </label>
              <input
                type="text"
                value={currentConfig.heading_text}
                onChange={(e) => updateCurrentConfig("heading_text", e.target.value)}
                className="text-field-input"
              />
            </div>

            <div>
              <label className="text-field-label">
                Review word (singular)
              </label>
              <input
                type="text"
                value={currentConfig.review_word_singular}
                onChange={(e) => updateCurrentConfig("review_word_singular", e.target.value)}
                className="text-field-input"
              />
            </div>

            <div>
              <label className="text-field-label">
                Review word (plural)
              </label>
              <input
                type="text"
                value={currentConfig.review_word_plural}
                onChange={(e) => updateCurrentConfig("review_word_plural", e.target.value)}
                className="text-field-input"
              />
            </div>

            <div>
              <label className="text-field-label">
                No reviews text
              </label>
              <input
                type="text"
                value={currentConfig.no_reviews_text}
                onChange={(e) => updateCurrentConfig("no_reviews_text", e.target.value)}
                className="text-field-input"
              />
            </div>

            <div>
              <label className="text-field-label">
                Write button text
              </label>
              <input
                type="text"
                value={currentConfig.button_text}
                onChange={(e) => updateCurrentConfig("button_text", e.target.value)}
                className="text-field-input"
              />
            </div>


          </div>
        </AccordionItem>

        {/* Widget header Accordion */}
        <AccordionItem
          id="header"
          title="Widget header"
          isOpen={openAccordion === "header"}
          onToggle={() => handleToggleAccordion("header")}
        >
          <div className="header-checkbox-list">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Show rating average (e.g. 4.1)</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Show verified reviews badge</span>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Show media slider bar</span>
            </label>
          </div>
        </AccordionItem>

        {/* Carousel settings Accordion (Only for Layout 2!) */}
        {selectedLayout === "layout_2" && (
          <AccordionItem
            id="carousel"
            title="Carousel settings"
            isOpen={openAccordion === "carousel"}
            onToggle={() => handleToggleAccordion("carousel")}
          >
            <div className="text-fields-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="text-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600" }}>
                  Desktop Slides (Visible)
                </label>
                <select
                  value={currentConfig.carousel_desktop_slides ?? 3}
                  onChange={(e) => updateCurrentConfig("carousel_desktop_slides", parseInt(e.target.value, 10))}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #babfc3", outline: "none", background: "white" }}
                >
                  <option value={1}>1 slide</option>
                  <option value={2}>2 slides</option>
                  <option value={3}>3 slides</option>
                  <option value={4}>4 slides</option>
                </select>
              </div>

              <div>
                <label className="text-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600" }}>
                  Mobile Slides (Visible)
                </label>
                <select
                  value={currentConfig.carousel_mobile_slides ?? 1}
                  onChange={(e) => updateCurrentConfig("carousel_mobile_slides", parseInt(e.target.value, 10))}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #babfc3", outline: "none", background: "white" }}
                >
                  <option value={1}>1 slide</option>
                  <option value={2}>2 slides</option>
                  <option value={3}>3 slides</option>
                </select>
              </div>

              <div style={{ marginTop: "4px" }}>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={currentConfig.carousel_show_arrows ?? true}
                    onChange={(e) => updateCurrentConfig("carousel_show_arrows", e.target.checked)}
                  />
                  <span style={{ fontSize: "0.85rem" }}>Show navigation arrows</span>
                </label>
              </div>

              <div style={{ marginTop: "4px" }}>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={currentConfig.carousel_auto_slide ?? false}
                    onChange={(e) => updateCurrentConfig("carousel_auto_slide", e.target.checked)}
                  />
                  <span style={{ fontSize: "0.85rem" }}>Enable auto-sliding</span>
                </label>
              </div>

              {currentConfig.carousel_auto_slide && (
                <div>
                  <label className="text-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600" }}>
                    Auto-slide Speed (seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={15}
                    value={currentConfig.carousel_auto_slide_speed ?? 5}
                    onChange={(e) => updateCurrentConfig("carousel_auto_slide_speed", parseInt(e.target.value, 10) || 5)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #babfc3", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              )}
            </div>
          </AccordionItem>
        )}

        {/* Image Carousel settings Accordion (Only for Layout 1 and Layout 2) */}
        {(selectedLayout === "layout_1" || selectedLayout === "layout_2") && (
          <AccordionItem
            id="image_carousel"
            title="Image Carousel settings"
            isOpen={openAccordion === "image_carousel"}
            onToggle={() => handleToggleAccordion("image_carousel")}
          >
            <div className="text-fields-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="text-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600" }}>
                  Desktop Slides (Visible)
                </label>
                <select
                  value={currentConfig.image_carousel_desktop_slides ?? 4}
                  onChange={(e) => updateCurrentConfig("image_carousel_desktop_slides", parseInt(e.target.value, 10))}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #babfc3", outline: "none", background: "white" }}
                >
                  <option value={1}>1 slide</option>
                  <option value={2}>2 slides</option>
                  <option value={3}>3 slides</option>
                  <option value={4}>4 slides</option>
                  <option value={5}>5 slides</option>
                </select>
              </div>

              <div>
                <label className="text-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600" }}>
                  Mobile Slides (Visible)
                </label>
                <select
                  value={currentConfig.image_carousel_mobile_slides ?? 2}
                  onChange={(e) => updateCurrentConfig("image_carousel_mobile_slides", parseInt(e.target.value, 10))}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #babfc3", outline: "none", background: "white" }}
                >
                  <option value={1}>1 slide</option>
                  <option value={2}>2 slides</option>
                  <option value={3}>3 slides</option>
                  <option value={4}>4 slides</option>
                </select>
              </div>

              <div style={{ marginTop: "4px" }}>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={currentConfig.image_carousel_show_arrows ?? true}
                    onChange={(e) => updateCurrentConfig("image_carousel_show_arrows", e.target.checked)}
                  />
                  <span style={{ fontSize: "0.85rem" }}>Show navigation arrows</span>
                </label>
              </div>

              <div style={{ marginTop: "4px" }}>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={currentConfig.image_carousel_auto_slide ?? false}
                    onChange={(e) => updateCurrentConfig("image_carousel_auto_slide", e.target.checked)}
                  />
                  <span style={{ fontSize: "0.85rem" }}>Enable auto-sliding</span>
                </label>
              </div>

              {currentConfig.image_carousel_auto_slide && (
                <div>
                  <label className="text-field-label" style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", fontWeight: "600" }}>
                    Auto-slide Speed (seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={15}
                    value={currentConfig.image_carousel_auto_slide_speed ?? 5}
                    onChange={(e) => updateCurrentConfig("image_carousel_auto_slide_speed", parseInt(e.target.value, 10) || 5)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #babfc3", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              )}
            </div>
          </AccordionItem>
        )}
      </div>

      {/* Sidebar Footer (Back only) */}
      <div className="sidebar-footer back-only">
        <button
          onClick={() => setActiveView("select-layout")}
          className="back-layouts-btn"
        >
          Back to layouts
        </button>
      </div>
    </div>
  );
}
