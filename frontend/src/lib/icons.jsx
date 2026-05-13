const I = ({ children, size = 16, stroke = 1.6, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round"
       className={className} aria-hidden="true">
    {children}
  </svg>
)

export const ICN = {
  hardhat:     (p = {}) => <I {...p}><path d="M2 18h20"/><path d="M4 18a8 8 0 0 1 16 0"/><path d="M10 10V6a2 2 0 0 1 4 0v4"/><path d="M6 14h12"/></I>,
  building:    (p = {}) => <I {...p}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></I>,
  folder:      (p = {}) => <I {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></I>,
  layers:      (p = {}) => <I {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></I>,
  coin:        (p = {}) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M9.5 9.5h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4"/></I>,
  trending:    (p = {}) => <I {...p}><path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/></I>,
  alert:       (p = {}) => <I {...p}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/></I>,
  check:       (p = {}) => <I {...p}><polyline points="20 6 9 17 4 12"/></I>,
  chev:        (p = {}) => <I {...p}><polyline points="9 18 15 12 9 6"/></I>,
  chevDown:    (p = {}) => <I {...p}><polyline points="6 9 12 15 18 9"/></I>,
  arrowLeft:   (p = {}) => <I {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></I>,
  arrowUpRight:(p = {}) => <I {...p}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></I>,
  cal:         (p = {}) => <I {...p}><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></I>,
  inbox:       (p = {}) => <I {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></I>,
  pie:         (p = {}) => <I {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></I>,
  doc:         (p = {}) => <I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h4"/></I>,
  download:    (p = {}) => <I {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></I>,
  menu:        (p = {}) => <I {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></I>,
  close:       (p = {}) => <I {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>,
  logout:      (p = {}) => <I {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></I>,
}
