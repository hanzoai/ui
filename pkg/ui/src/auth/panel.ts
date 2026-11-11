/**
 * The shared sign-in panel and its hand-off, alone: what a Hanzo site draws on
 * its front page (./SignInPanel.tsx) and where each press goes (./handoff.ts).
 *
 * Its own entry so importing the panel does not load the in-place sign-in form
 * (./SignIn.tsx), which needs a newer @hanzo/iam (`SecondFactor`) and
 * @hanzogui/shell (`HanzoMark`). A bundler binds every name a module imports, so
 * a site without those failed to build from `@hanzo/ui/auth` even though it drew
 * only the panel.
 */
export { SignInPanel, type SignInPanelProps } from './SignInPanel'
export { address, handoff, SIGNIN, type ProviderKind, type Way } from './handoff'
