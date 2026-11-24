const ICONS = {
  all: <><rect x="4" y="4" width="6.5" height="6.5" rx="2" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="2" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" /></>,
  deck: <><rect x="8" y="4" width="12" height="16" rx="3" /><path d="M5 7v10" /></>,
  add: <path d="M12 5v14M5 12h14" />,
  no: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  yes: <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  sort: <path d="M4 7h16M7 12h10M10 17h4" />,
  back: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  edit: <path d="M5 19l1-4L15.5 5.5l3 3L9 18z" />,
  trash: <path d="M5 7.5h14M10 7.5V5h4v2.5M7 7.5l.8 11.5h8.4L17 7.5" />,
  leave: <path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3M10 12h9M15.5 8.5L19 12l-3.5 3.5" />,
  link: <path d="M8 16L17 7M10 7h7v7" />,
  image: <><rect x="4" y="5" width="16" height="14" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M5 17l5-4 3 2.5 3-3 4 4" /></>,
  text: <path d="M6 7V5.5h12V7M12 5.5v13M9.5 18.5h5" />,
  plate: <><rect x="3.5" y="5" width="17" height="14" rx="4" fill="currentColor" fillOpacity=".25" /><path d="M9 15.5l3-7 3 7M10 13.4h4" /></>,
  eye: <><path d="M3 12s3.2-5.5 9-5.5S21 12 21 12s-3.2 5.5-9 5.5S3 12 3 12z" /><circle cx="12" cy="12" r="2.4" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
  half: <><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2z" fill="currentColor" /><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" /></>,
  down: <path d="M12 5v14M6.5 13.5L12 19l5.5-5.5" />,
  next: <path d="M5 12h14M13 6l6 6-6 6" />,
  up: <path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

export function Icon({ name }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
}

/** Give `label` to an icon-only button, or children to a pill. */
export default function Glass({ icon, label, className = "", children, ...rest }) {
  return (
    <button type="button" className={`glass ${className}`} aria-label={label} {...rest}>
      <Icon name={icon} />
      {children}
    </button>
  );
}
