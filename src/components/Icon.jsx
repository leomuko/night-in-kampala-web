const paths = {
  menu: <path d="M3 5h18M3 12h18M3 19h18" />,
  search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
  bag: <><path d="M5 7h14l2 14H3L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  arrow: <path d="M3 12h18m-7-7 7 7-7 7" />,
  chevron: <path d="m6 9 6 6 6-6" />,
};

export default function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
