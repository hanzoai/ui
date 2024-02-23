'use client'

import React, {
  useContext,
  useState,
  type PropsWithChildren
} from 'react'

type AuthContextType = {
  user: {email: string} | null,
  setUser: React.Dispatch<React.SetStateAction<{email: string} | null>>
}

const AuthServiceContext = React.createContext<AuthContextType | undefined>(undefined)

export const useCurrentUser = (): AuthContextType => {
  const context = useContext(AuthServiceContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within an AuthServiceProvider')
  }
  return context
}

export const AuthServiceProvider: React.FC<
  PropsWithChildren & { user: {email: string} | null }
> = ({
  children,
  user
}) => {
  const [currentUser, setCurrentUser] = useState<{email: string} | null>(user)

  return (
    <AuthServiceContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      {children}
    </AuthServiceContext.Provider>
  )
}