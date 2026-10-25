export function Tooltip({ tooltip }) {
  if (!tooltip) return null;

  return (
    <div className="tooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      {tooltip.content}
    </div>
  );
}
