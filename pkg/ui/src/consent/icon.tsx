/**
 * The privacy options icon California publishes for the "Your Privacy Choices"
 * link (Cal. Code Regs. tit. 11, § 7015(b)): a toggle, its white half checked
 * and its blue half crossed, drawn on the published 30×14 box at any height.
 *
 * Beside the words "Your Privacy Choices" it is decorative, and the words are
 * the link's name. Alone, pass `label` and it is named itself.
 */
export const PrivacyChoicesIcon = ({ size = 14, label }: { size?: number; label?: string }) => (
  <svg
    width={(size * 30) / 14}
    height={size}
    viewBox="0 0 30 14"
    focusable="false"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    style={{ flexShrink: 0, display: 'block' }}
  >
    <path d="M7.4 12.8h6.8l3.1-11.6H7.4C4.2 1.2 1.6 3.8 1.6 7s2.6 5.8 5.8 5.8z" fill="#fff" fillRule="evenodd" clipRule="evenodd" />
    <path
      d="M22.6 0H7.4c-3.9 0-7 3.1-7 7s3.1 7 7 7h15.2c3.9 0 7-3.1 7-7s-3.2-7-7-7zm-21 7c0-3.2 2.6-5.8 5.8-5.8h9.9l-3.1 11.6H7.4c-3.2 0-5.8-2.6-5.8-5.8z"
      fill="#06f"
      fillRule="evenodd"
      clipRule="evenodd"
    />
    <path
      d="M24.6 4c.2.2.2.6 0 .8L22.5 7l2.2 2.2c.2.2.2.6 0 .8-.2.2-.6.2-.8 0l-2.2-2.2-2.2 2.2c-.2.2-.6.2-.8 0-.2-.2-.2-.6 0-.8L20.8 7l-2.2-2.2c-.2-.2-.2-.6 0-.8.2-.2.6-.2.8 0l2.2 2.2L23.8 4c.2-.2.6-.2.8 0z"
      fill="#fff"
    />
    <path d="M12.7 4.1c.2.2.3.6.1.8L8.6 9.8c-.1.1-.2.2-.3.2-.2.1-.5.1-.7-.1L5.4 7.7c-.2-.2-.2-.6 0-.8.2-.2.6-.2.8 0L8 8.6l3.8-4.5c.2-.2.6-.2.9 0z" fill="#06f" />
  </svg>
)
