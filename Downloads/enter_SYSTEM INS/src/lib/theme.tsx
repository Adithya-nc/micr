import { ThemeProvider as NextThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="resolvesphere-theme">
      {children}
    </NextThemeProvider>
  )
}
