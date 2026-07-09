export default function AccordionItem({ id, title, isOpen, onToggle, children }) {
  return (
    <div className="accordion-item-border">
      <div onClick={onToggle} className="accordion-trigger-row">
        <span>{title}</span>
        <span className={`accordion-arrow ${isOpen ? "rotated" : ""}`}>
          ▼
        </span>
      </div>
      <div className={`accordion-content-box ${isOpen ? "open" : ""}`}>
        {children}
      </div>
    </div>
  );
}
