// A browser a program drives — Playwright, Puppeteer, Selenium, a CI run or an
// uptime check — says so in `navigator.webdriver` (WebDriver §4.1). Its visits
// are ours, not an audience: the tag manager loads no platform pixel for it, and
// every event it sends carries `internal: true`, which cloud's forwarder and the
// insights bridge read to keep it off ad platforms and out of real traffic.
export const automated = (): boolean => typeof navigator !== 'undefined' && navigator.webdriver === true
