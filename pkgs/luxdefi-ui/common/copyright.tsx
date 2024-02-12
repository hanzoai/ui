import React from 'react'

const FIRST = 2020

const Copyright: React.FC = () => {

  const year = new Date().getFullYear()
  const yearString = (year > FIRST) ? `${FIRST} - ${year}` : FIRST.toString()

  return (
    <>{`Copyright © ${yearString} Lux Partners Ltd. `} <br className='sm:hidden'/> All rights reserved.</> 
  )
}

export default Copyright
