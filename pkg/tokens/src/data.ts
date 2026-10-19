/**
 * The data palette — colour for what a PERSON colours, never for chrome.
 *
 * Hanzo's chrome is monochrome: one neutral ladder and an opacity ladder, with
 * hue reserved for genuine states (theme.ts). Records are different. A select
 * option, a kanban column, an object's icon tile, an avatar's initial and a
 * chart series carry a colour the user chose (or one derived from a name), and
 * that colour is data: it has to survive a theme switch, read on both grounds
 * and stay one of a fixed set so it can be stored by name. This module is that
 * set, scoped to data the way `--art-*` is scoped to artwork.
 *
 * Thirty 12-step scales, light and dark, as sRGB hex. Twenty-four of the
 * twenty-five pickable hues and all five neutrals are Radix Colors 3.0.0 scales
 * (their display-p3 sources are identical, measured; MIT, see NOTICE): `blue` is
 * Radix indigo and `teal` is Radix teal. `gray` is a neutral of Twenty's own
 * (twenty-ui, MIT). The sRGB values are the nearest in-gamut conversion of the
 * display-p3 sources twenty-ui ships.
 *
 * The steps keep Radix's meaning, and components read them by role:
 *
 *   3   a tag's fill            11  a tag's text
 *   4   a tile or avatar fill   10  a tile's glyph
 *   5   an outlined avatar      12  an avatar's initial
 *   6   an outlined edge         9  the solid hue (a dot, a solid tag)
 *
 * Emitted by scripts/gen-css.mjs as `--data-<hue>-<step>` into dist/data.css
 * (`@hanzo/tokens/css/data`) and the full bundle.
 */

/** The twenty-five hues a person can pick, in the order a new option takes the next one. */
export const hues = ['red', 'ruby', 'crimson', 'tomato', 'orange', 'amber', 'yellow', 'lime', 'grass', 'green', 'jade', 'mint', 'teal', 'cyan', 'sky', 'blue', 'iris', 'violet', 'purple', 'plum', 'pink', 'bronze', 'gold', 'brown', 'gray'] as const

/** Five tinted neutrals, for data that wants a grey with a cast. Not offered by a picker. */
export const neutrals = ['mauve', 'olive', 'sage', 'sand', 'slate'] as const

export type PickHue = (typeof hues)[number]
export type DataHue = PickHue | (typeof neutrals)[number]

/** Twelve steps, lightest-to-strongest on light and darkest-to-strongest on dark. */
export type Scale = readonly [string, string, string, string, string, string, string, string, string, string, string, string]

/** Every scale, both themes. */
export const scales: Record<DataHue, { light: Scale; dark: Scale }> = {
  red: {
    light: ['#fffcfc', '#fff7f7', '#feebec', '#ffdbdc', '#ffcdce', '#fdbdbe', '#f4a9aa', '#eb8e90', '#e5484d', '#dd3e42', '#ce2c31', '#641723'],
    dark: ['#191111', '#201314', '#3b1219', '#500e1c', '#611623', '#73232d', '#8c333a', '#b54548', '#e5484d', '#ec5e5e', '#ff8a88', '#ffd1d9'],
  },
  ruby: {
    light: ['#fffcfd', '#fff7f8', '#feeaed', '#ffdce1', '#fecfd6', '#f8bfc8', '#efacb8', '#e592a3', '#e54666', '#dc3b5d', '#ca244d', '#64172b'],
    dark: ['#191113', '#1e1517', '#3a141e', '#4e1325', '#5e1a2e', '#6f2539', '#883447', '#b3445a', '#e54666', '#ec5a72', '#ff8a94', '#fed2e1'],
  },
  crimson: {
    light: ['#fffcfd', '#fef7f9', '#ffe9f0', '#fedce7', '#facedd', '#f3bed1', '#eaacc3', '#e094b2', '#e93d82', '#df3478', '#cb1d63', '#621639'],
    dark: ['#191114', '#201318', '#381525', '#4d122f', '#5c1839', '#6d2445', '#873357', '#b0436e', '#e93d82', '#ee528a', '#ff87a8', '#fdd3e8'],
  },
  tomato: {
    light: ['#fffcfc', '#fff8f7', '#ffebe7', '#ffdcd3', '#ffcdc2', '#fdbdaf', '#f5a898', '#ec8e7b', '#e54d2e', '#dd4425', '#d13415', '#5c271f'],
    dark: ['#181111', '#1f1513', '#391714', '#4e1511', '#5e1c16', '#6e2920', '#863a2d', '#ac4d39', '#e54d2e', '#ec6142', '#ff8e6c', '#fbd3cb'],
  },
  orange: {
    light: ['#fefcfb', '#fff7ed', '#ffefd6', '#ffdda9', '#ffcf8b', '#ffc182', '#f5ae73', '#ec9455', '#f76a15', '#ef5f00', '#d14e00', '#582d1d'],
    dark: ['#17120e', '#1e160f', '#331e0b', '#481f00', '#562800', '#66350c', '#7e451d', '#a35829', '#f76a15', '#ff791b', '#ff9b52', '#ffe0c2'],
  },
  amber: {
    light: ['#fefdfb', '#fefbe9', '#fff7c2', '#ffee9c', '#fbe577', '#f4d673', '#e9c163', '#e2a336', '#ffc100', '#ffba18', '#ad6200', '#4f3422'],
    dark: ['#16120c', '#1d180f', '#302008', '#412700', '#4e3000', '#5c3d05', '#714f1a', '#8f6424', '#ffc100', '#ffdc00', '#ffc916', '#ffe7b3'],
  },
  yellow: {
    light: ['#fdfdf9', '#fefce9', '#fffab8', '#fff394', '#ffe770', '#f3d768', '#e4c767', '#d5ae39', '#ffea00', '#ffdc00', '#a06e00', '#473b1f'],
    dark: ['#14110b', '#1b180f', '#2c2305', '#372b00', '#433500', '#524202', '#665417', '#836a20', '#ffea00', '#ffff57', '#f5e147', '#f6eeb4'],
  },
  lime: {
    light: ['#fcfdfa', '#f8faf3', '#eef6d6', '#e2f0bd', '#d3e7a6', '#c2da91', '#abc978', '#8db554', '#bdee63', '#b0e64c', '#5c7c2f', '#37401c'],
    dark: ['#11130c', '#151a10', '#1f2917', '#29371d', '#334423', '#3d522a', '#496231', '#577538', '#bdee63', '#d4ff70', '#bde56b', '#e3f7ba'],
  },
  grass: {
    light: ['#fbfefb', '#f5fbf5', '#e9f7e9', '#daf0db', '#c9e9ca', '#b2deb5', '#94ce9a', '#65ba74', '#46a758', '#3e9a4f', '#2a7e3b', '#203c25'],
    dark: ['#0e1511', '#141a15', '#1b2a1e', '#1d3a24', '#25482d', '#2d5736', '#366740', '#3e7949', '#46a758', '#53b365', '#71d083', '#c2f0c2'],
  },
  green: {
    light: ['#fbfefc', '#f4fbf6', '#e6f6eb', '#d6f1df', '#c4e8d1', '#adddc0', '#8eceaa', '#5bb88b', '#30a46c', '#2b9a66', '#00824d', '#193b2d'],
    dark: ['#0e1512', '#121b17', '#132d21', '#113b29', '#174933', '#1f573e', '#28684a', '#2f7c57', '#30a46c', '#33b074', '#3dd68c', '#b1f1cb'],
  },
  jade: {
    light: ['#fbfefd', '#f4fbf7', '#e5f7ed', '#d6f1e3', '#c3e9d7', '#acdec9', '#8bceb6', '#55ba9f', '#29a383', '#26997b', '#00825c', '#1d3b31'],
    dark: ['#0d1512', '#121c18', '#0f2e23', '#0a3b2c', '#104837', '#1b5645', '#246854', '#2a7e68', '#29a383', '#27b08b', '#1ed8a4', '#adf0d4'],
  },
  mint: {
    light: ['#f9fefd', '#f2fbf9', '#ddf9f2', '#c8f4e9', '#b3ecde', '#9ce0d0', '#7ecfbd', '#4cbba5', '#86ead4', '#7de1cb', '#037864', '#16433c'],
    dark: ['#0d1515', '#0f1b1b', '#092c2b', '#003a39', '#004744', '#0f5650', '#1e685f', '#277f70', '#86ead4', '#a8f5e5', '#58d5ba', '#c4f5e1'],
  },
  teal: {
    light: ['#fafefd', '#f3fbf9', '#e0f8f3', '#ccf3ea', '#b8ebe0', '#a1ded2', '#83cdc1', '#53b9ab', '#12a594', '#0d9b8a', '#00826d', '#0d3d38'],
    dark: ['#0d1514', '#111c1b', '#0d2d2a', '#023b37', '#084843', '#145750', '#1c6961', '#1f7f74', '#12a594', '#0db39e', '#0ad8b6', '#adf0dd'],
  },
  cyan: {
    light: ['#fafdfe', '#f2fafb', '#def7f9', '#caf1f6', '#b5e9f0', '#9ddee7', '#7dcedc', '#3db9ce', '#01a2c7', '#0797b9', '#007da5', '#0d3c48'],
    dark: ['#0b1619', '#101b20', '#082c36', '#003848', '#004558', '#045468', '#12677e', '#11809c', '#01a2c7', '#23afd0', '#4ccce5', '#b6ecf7'],
  },
  sky: {
    light: ['#f9feff', '#f1fafd', '#e1f6fd', '#d1f0fb', '#bee7f5', '#a9daed', '#8dcae3', '#60b3d7', '#7ce2fe', '#74daf8', '#00749e', '#1d3e56'],
    dark: ['#0d141e', '#111a27', '#112840', '#113655', '#154467', '#1b537b', '#1f6692', '#197cae', '#7ce2fe', '#a8eeff', '#75c7f0', '#c2f3ff'],
  },
  blue: {
    light: ['#fdfdfe', '#f7f9ff', '#edf2fe', '#e0e9ff', '#d2deff', '#c1d0ff', '#abbdf9', '#8da4ef', '#3e63dd', '#3358d4', '#3a5bc7', '#1f2d5c'],
    dark: ['#11131f', '#141726', '#182449', '#1d2e61', '#253974', '#304384', '#3a4f97', '#435db2', '#3e63dd', '#5472e4', '#9db1ff', '#d6e1ff'],
  },
  iris: {
    light: ['#fdfdff', '#f8f8ff', '#f0f1fe', '#e6e7ff', '#dadcff', '#cbcdff', '#b8b9f8', '#9b9ef0', '#5b5bd6', '#5151cd', '#5753c6', '#272962'],
    dark: ['#13131e', '#171625', '#202248', '#262a65', '#303374', '#3d3d82', '#4a4a95', '#5a58b1', '#5b5bd6', '#6e6ade', '#b0a9ff', '#e0dffe'],
  },
  violet: {
    light: ['#fdfcfe', '#faf8ff', '#f4f0fe', '#ebe5ff', '#e1d9ff', '#d4cafe', '#c2b5f5', '#aa99ec', '#6e56cf', '#654dc4', '#6550b9', '#2f265f'],
    dark: ['#14121f', '#1b1525', '#291f44', '#33255b', '#3c2e69', '#473876', '#56468b', '#6858ad', '#6e56cf', '#7d66d9', '#bba5ff', '#e2ddfe'],
  },
  purple: {
    light: ['#fefcfe', '#fbf7fe', '#f7edfd', '#f2e2fc', '#ead5f9', '#e0c4f4', '#d1afec', '#be93e4', '#8e4ec6', '#8347b9', '#8145b5', '#402060'],
    dark: ['#18111b', '#1e1523', '#2f1c3b', '#3d224e', '#48295c', '#54346b', '#664282', '#8357aa', '#8e4ec6', '#9a5cd0', '#d59cff', '#ecd9fa'],
  },
  plum: {
    light: ['#fefcff', '#fdf7fd', '#fbebfb', '#f7def8', '#f1d1f3', '#e9c2ec', '#deade3', '#cf91d8', '#ab4aba', '#a144af', '#953ea3', '#53195d'],
    dark: ['#181118', '#201320', '#351935', '#451d47', '#502454', '#5e3062', '#734079', '#92549c', '#ab4aba', '#b658c4', '#e796f3', '#f4d4f4'],
  },
  pink: {
    light: ['#fffcfe', '#fef7fb', '#fee9f6', '#fbdcef', '#f6cee7', '#efbfdd', '#e7acd1', '#dd93c2', '#d6409f', '#cf3897', '#c2298a', '#651249'],
    dark: ['#191117', '#21121d', '#37172f', '#4b143d', '#591c47', '#692955', '#833869', '#a84885', '#d6409f', '#de51a8', '#ff80ca', '#fdd1ea'],
  },
  bronze: {
    light: ['#fdfcfc', '#fdf7f5', '#f6edea', '#efe4df', '#e7d9d3', '#dfcdc5', '#d3bcb3', '#c2a499', '#a18072', '#957468', '#7d5e54', '#43302b'],
    dark: ['#141110', '#1c1918', '#262120', '#302a27', '#3b3330', '#493e3a', '#5a4d47', '#6f5f57', '#a18072', '#ae8d7e', '#d4b3a5', '#ede0d9'],
  },
  gold: {
    light: ['#fdfdfc', '#faf9f2', '#f2f0e7', '#eae6dc', '#e1dccf', '#d7d0bf', '#cbc0aa', '#b9a88d', '#978365', '#8c795e', '#71624b', '#3b352b'],
    dark: ['#121211', '#1b1a17', '#24231f', '#2e2b26', '#38352f', '#444039', '#544f46', '#696256', '#978365', '#a39073', '#cbb99f', '#e8e2d9'],
  },
  brown: {
    light: ['#fefdfc', '#fcf9f5', '#f6eee7', '#f0e4d9', '#ebdaca', '#e4cdb8', '#dcbc9f', '#cea37e', '#ad7f58', '#a07553', '#815e46', '#3e332e'],
    dark: ['#12110f', '#1c1816', '#28211d', '#322922', '#3e3128', '#4d3c2f', '#614a39', '#7c5f46', '#ad7f58', '#b98c67', '#dbb594', '#f2e1ca'],
  },
  gray: {
    light: ['#ffffff', '#fcfcfc', '#f9f9f9', '#f1f1f1', '#ebebeb', '#d6d6d6', '#cccccc', '#b3b3b3', '#999999', '#838383', '#666666', '#333333'],
    dark: ['#171717', '#1b1b1b', '#191919', '#1d1d1d', '#222222', '#484848', '#4c4c4c', '#666666', '#818181', '#7b7b7b', '#b3b3b3', '#ebebeb'],
  },
  mauve: {
    light: ['#fdfcfd', '#faf9fb', '#f2eff3', '#eae7ec', '#e2dfe6', '#dbd8e0', '#d0cdd7', '#bcbac7', '#8e8c99', '#83818e', '#65636d', '#211f26'],
    dark: ['#121113', '#1a191b', '#232225', '#2b292d', '#323035', '#3c393f', '#49474e', '#625f69', '#6f6d78', '#7d7a85', '#b5b2bc', '#eeeef0'],
  },
  olive: {
    light: ['#fcfdfc', '#f8faf8', '#eff1ef', '#e7e9e7', '#dfe2df', '#d7dad7', '#cccfcc', '#b9bcb8', '#898e87', '#7f837d', '#60655f', '#1d211c'],
    dark: ['#111210', '#181917', '#212220', '#282a27', '#2f312e', '#383a37', '#454943', '#5c625b', '#687066', '#767d74', '#afb5ad', '#eceeec'],
  },
  sage: {
    light: ['#fbfdfc', '#f7f9f8', '#eef1f0', '#e6e9e8', '#dfe2e0', '#d7dad8', '#cbcfcd', '#b8bcbb', '#868e8b', '#7c8481', '#5f6563', '#1a211e'],
    dark: ['#101211', '#171918', '#202221', '#272a28', '#2e3130', '#373b39', '#444947', '#5b625f', '#63706b', '#717d79', '#adb5b2', '#eceeed'],
  },
  sand: {
    light: ['#fdfdfc', '#f9f9f8', '#f1f0ef', '#e9e9e6', '#e2e1de', '#dad9d6', '#cfcfca', '#bcbbb5', '#8d8d86', '#82827c', '#63635e', '#21201c'],
    dark: ['#111110', '#191918', '#222221', '#2a2a28', '#31312e', '#3b3a37', '#494844', '#62605a', '#6f6d66', '#7d7b74', '#b5b3ad', '#eeeeec'],
  },
  slate: {
    light: ['#fcfcfd', '#f9f9fb', '#f0f0f3', '#e7e8ec', '#e0e1e6', '#d9d9e0', '#cdced6', '#b9bbc6', '#8b8d98', '#80838d', '#60646c', '#1c2024'],
    dark: ['#111113', '#18191b', '#212225', '#272a2d', '#2e3135', '#363a3f', '#43484e', '#5a6169', '#696e77', '#777b84', '#b0b4ba', '#edeef0'],
  },
}

/** A step's custom property: `data('blue', 3)` is `var(--data-blue-3)`. */
export const data = (hue: DataHue, step: number): string => `var(--data-${hue}-${step})`

/** The hue after `hue` in pick order, wrapping; `gray` when there is none. */
export const next = (hue?: PickHue | null): PickHue => {
  const i = hue ? hues.indexOf(hue) : -1
  return i < 0 ? 'gray' : hues[(i + 1) % hues.length]
}

/**
 * The hue a string is drawn in: a rolling hash of `seed` (each step
 * `code + (hash << 5) - hash`), absolute value modulo the twenty-five pickable
 * hues. The same formula as twenty-ui's stringToThemeColor (MIT), so a record
 * imported from Twenty keeps its colour. Seed with a record id rather than a name
 * and a rename keeps it too.
 */
export const hueOf = (seed: string): PickHue => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return hues[Math.abs(hash) % hues.length]
}

