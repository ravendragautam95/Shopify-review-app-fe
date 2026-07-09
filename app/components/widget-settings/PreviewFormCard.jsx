export default function PreviewFormCard({ style = {} }) {
  return (
    <div className="preview-form-card" style={style}>
      <h3 className="preview-form-title">
        Write a Customer Review
      </h3>

      <div className="preview-form-alert">
        Logged in as <strong>Emily R.</strong>. Your review will be submitted under this account.
      </div>

      <div className="preview-form-group">
        <label className="preview-form-label">Overall Rating</label>
        <div className="preview-star-picker" style={{ display: "flex", gap: "4px" }}>
          ★ ★ ★ ★ ★
        </div>
      </div>

      <div className="preview-form-group">
        <label className="preview-form-label">Review</label>
        <textarea
          placeholder="Write your review here..."
          rows={3}
          className="preview-textarea"
          defaultValue="Loved this winter sweater! Extremely soft and keeps me exceptionally warm during snowy evenings."
        />
      </div>

      <div className="preview-form-group">
        <label className="preview-form-label">Add a Photo</label>
        <div className="preview-file-upload">
          <span>📷</span> Choose File
        </div>
      </div>

      {/* Submit button */}
      <div className="preview-form-group">
        <button className="preview-submit-btn">
          Submit Review
        </button>
      </div>
    </div>
  );
}
