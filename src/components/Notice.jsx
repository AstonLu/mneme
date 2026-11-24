export default function Notice({ title, detail, action, onAction }) {
  return (
    <div className="notice" role="status">
      <p className="notice-title">{title}</p>
      {detail && <p>{detail}</p>}
      {action && <button className="btn" onClick={onAction}>{action}</button>}
    </div>
  );
}
