import AU_B from './AU-B'
import AG_B from './AG-B'

export default {
  tok: 'LXB',
  label: 'Lux Bullion',
  titleToken: '',
  ch: [
    {
      tok: 'AU',
      titleToken: 'Lux Gold',
      label: 'Lux Gold',
      img: 'AU_B',
      desc: "Forge your connection to the real world with Lux Gold, crafted with excellence in Dubai.",
      ch: [
        {
          tok: 'B',
          label: 'Minted Bar',
          ch: AU_B
        },
        {
          tok: 'C',
          label: 'Minted Coin',
          img: 'AU_C',
          ch: [
            {
              tok: '1-OZ',
              price: 1938,
            }
          ]
        },
        {
          tok: 'MB',
          label: 'Multibar',
          img: 'AU_MB',
          ch: [
            {
              tok: '100x1-G',
              price: 6221.39
            }
          ]
        },
        {
          tok: 'GD',
          label: 'Good Delivery Bar',
          ch: [
            {
              tok: '400-OZ',
              price: 800000,
              shortTitle: 'GD Bar',
            }
          ]
        }
      ]
    },
    {
      tok: 'AG',
      img: 'AG_B',
      desc: 'Get unprecedented access to silver with 1:1 asset-backed Lux Silver NFTs, sovereign ownership of physical silver without management fees, and mine-direct discount pricing.',
      titleToken: 'Lux Silver',
      label: 'Lux Silver',
      ch: [
        {
          tok: 'B',
          label: 'Minted Bar',
          ch: AG_B
        }, 
        {
          tok: 'C',
          label: 'Minted Coin',
          img: 'AG_C',
          ch: [
            {
              tok: '1-OZ',
              price: 23.04,
            }
          ]
        },
        {
          tok: 'MB',
          label: 'Multibar',
          img: 'AG_MB',
          ch: [
            {
              tok: '100x1-G',
              price: 74.15,
            }
          ]
        },
        {
          tok: 'GD',
          label: 'Good Delivery Bar',
          ch: [
            {
              tok: '1000-OZ',
              price: 22000,
              shortTitle: 'GD Bar',
            }
          ]
        }
      ]
    }
  ], 
}