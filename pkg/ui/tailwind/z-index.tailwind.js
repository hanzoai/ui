const zIndex = {

  auto: 'auto',
  unset: 'unset',

  ...{
    'below-content-3': '-3',
    'below-content-2': '-2',
    'below-content-1': '-1',
    'below-content': '-1',
    'content': '0',
    'above-content': '1',
    'above-content-1': '1',
    'above-content-2': '2',
    'above-content-3': '3',
  },
    // popups that may scroll w content, appear below header, etc
    // for larger, modal popups, please use 'modal'
  ...{
    'below-popup-3': '7',
    'below-popup-2': '8',
    'below-popup-1': '9',
    'below-popup': '9',
    'popup': '10',
    'above-popup': '11',
    'above-popup-1': '11',
    'above-popup-2': '12',
    'above-popup-3': '13',
  },
  ...{
    'below-header-3': '17',
    'below-header-2': '18',
    'below-header-1': '19',
    'below-header': '19',
    'header': '20',
    'above-header': '21',
    'above-header-1': '21',
    'above-header-2': '22',
    'above-header-3': '23',
  },
    // drawer, dialog, full screen menu
  ...{
    'below-modal-3': '27',
    'below-modal-2': '28',
    'below-modal-1': '29',
    'below-modal': '29',
    'modal': '30',
    'above-modal': '31',
    'above-modal-1': '31',
    'above-modal-2': '32',
    'above-modal-3': '33',
  },
    // "highest": help button, other UI that floats above everything.
  ...{
    'below-floating-3': '37',
    'below-floating-2': '38',
    'below-floating-1': '39',
    'below-floating': '39',
    'floating': '40',
    'above-floating': '41',
    'above-floating-1': '41',
    'above-floating-2': '42',
    'above-floating-3': '43',
  },
}

for (let i = 0; i <= 50; i++) {
  zIndex[`${i}`] = `${i}` 
}

export default zIndex