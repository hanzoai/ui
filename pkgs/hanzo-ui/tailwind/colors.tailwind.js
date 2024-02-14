export default ({ colors }) => ({
  inherit: colors.inherit,
  current: colors.current,
  transparent: colors.transparent,
  input: "var(--hz-ui-input)",
  ring: "var(--hz-ui-ring)",
  background: 'var(--hz-ui-bg-0)',
    // levels forward in z-index (a la Material Design)
  level: {
    DEFAULT: "var(--hz-ui-bg-0)",
    '0': "var(--hz-ui-bg-0)",
    '1': "var(--hz-ui-bg-1)",
    '2': "var(--hz-ui-bg-2)",
    '3': "var(--hz-ui-bg-3)",
  },
  accent: "var(--hz-ui-fg-0)",      // full contrast (darkTheme:white) : heading and links hover
  foreground: "var(--hz-ui-fg-body)", // body text off-white (bright enough to contrast to bg-level-1)
  muted: {
    DEFAULT: "var(--hz-ui-fg-2)",   // de-emphasized: fine print
    '1': "var(--hz-ui-fg-2)",       // synonymous ^^^
    '2': "var(--hz-ui-fg-3)",       // disabled or very de-emphasized
    '3': "var(--hz-ui-fg-4)",       // very disabled ;)
    '4': "var(--hz-ui-fg-5)",       // disabled border
  },
  primary: {
    DEFAULT: "var(--hz-ui-primary)",
    lux: "var(--hz-ui-primary)", // in case there are two configs
    hover: "var(--hz-ui-primary-hover)",
    fg: "var(--hz-ui-primary-fg)",
  },
  secondary: {
    DEFAULT: "var(--hz-ui-secondary)",
    lux: "var(--hz-ui-secondary)", // in case there are two configs
    hover: "var(--hz-ui-secondary-hover)",
    fg: "var(--hz-ui-secondary-fg)",
  },
  destructive: {
    DEFAULT: "var(--hz-ui-destructive)",
    fg: "var(--hz-ui-destructive-fg)",
  },
  nav: {
    DEFAULT: "var(--hz-ui-nav)",
    hover: "var(--hz-ui-nav-hover)",
    current: "var(--hz-ui-nav-current)",
  },
})
