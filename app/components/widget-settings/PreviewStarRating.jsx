export default function PreviewStarRating({ rating, style = {} }) {
  const fullStars = Math.round(rating);
  const starStr = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  return (
    <div style={style}>
      {starStr}
    </div>
  );
}
