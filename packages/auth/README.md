# Hanzo Auth

## Initialization

Follow these steps to initialize authentication with Hanzo Auth for your project:

1. Install package with `pnpm i @hanzo/auth`

2. Create custom Header component that includes an `AuthWidget` from @hanzo/auth. See example in [luxdefi/sites repo](https://github.com/luxdefi/sites/tree/main/sites/credit/src/components/header)

3. Edit root layout component
``` typescript
// ... other imports

import { AuthServiceProvider } from '@hanzo/auth/service'
import { getUserServerSide } from '@hanzo/auth/server'
import type { AuthServiceConf } from '@hanzo/auth/types'

// custom header with AuthWidget
import Header from '@/components/header'

// ...other code

const RootLayout: React.FC<PropsWithChildren> = async ({
  children
}) =>  {
  const currentUser = await getUserServerSide()

  return (
    <AuthServiceProvider user={currentUser} conf={{} as AuthServiceConf}>
      <RootLayoutCommon siteDef={siteDef} header={false} >
        <Header siteDef={siteDef}/>
        {children}
      </RootLayoutCommon>
    </AuthServiceProvider>
  )
}
export default RootLayout
```

4. Create `/api/auth/login` route.
``` Typescript
import { NextRequest } from 'next/server'

import { handleLoginApiRequest } from '@hanzo/auth/server'

export async function POST(request: NextRequest) {
  return handleLoginApiRequest(request)
}
```

5. Create `/api/auth/logout` route.
``` Typescript
import { handleLogoutApiRequest } from '@hanzo/auth/server'

export async function GET() {
  return handleLogoutApiRequest()
}
```

6. Create `/login` route that uses `LoginComponent` from @hanzo/auth. See example in [luxdefi/sites repo](https://github.com/luxdefi/sites/tree/main/sites/credit/src/app/login)
