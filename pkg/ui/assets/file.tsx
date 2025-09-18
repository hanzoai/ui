// File icon map - placeholder for now
// TODO: Add actual file icons when SVG assets are available

export const fileIconMap: Record<string, string> = {
  aep: '',
  ai: '',
  avi: '',
  css: '',
  csv: '',
  dmg: '',
  doc: '',
  docx: '',
  gif: '',
  html: '',
  jpeg: '',
  jpg: '',
  js: '',
  json: '',
  pdf: '',
  png: '',
  ppt: '',
  pptx: '',
  psd: '',
  svg: '',
  xls: '',
  xlsx: '',
  xml: '',
};

export const PaperClipIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
    />
  </svg>
);