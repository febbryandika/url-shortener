import { useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-5"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-5"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
      <path d="M8 12h8" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
] as const

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/dashboard"
      onClick={onNavigate}
      className="flex items-center gap-2 font-semibold"
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <LinkIcon />
      </span>
      <span>URL Shortener</span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <Link
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            activeProps={{ className: 'bg-accent text-accent-foreground' }}
            inactiveProps={{
              className:
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            }}
          >
            <Icon />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SignOutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function UserSection() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  async function handleSignOut() {
    await authClient.signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="mt-auto border-t border-border pt-4">
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-foreground">
          {session?.user.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {session?.user.email}
        </p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <SignOutIcon />
        Sign out
      </button>
    </div>
  )
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const drawerRef = useRef<HTMLDialogElement>(null)

  function handleOpenDrawer() {
    drawerRef.current?.showModal()
  }

  function handleCloseDrawer() {
    drawerRef.current?.close()
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === drawerRef.current) handleCloseDrawer()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <Brand />
        <nav aria-label="Main" className="mt-8">
          <NavLinks />
        </nav>
        <UserSection />
      </aside>

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={handleOpenDrawer}
          aria-haspopup="dialog"
          aria-label="Open navigation menu"
          className="-ml-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MenuIcon />
        </button>
        <Brand />
      </header>

      {/* Slide-over drawer — mobile (native dialog: focus trap + Esc for free) */}
      <dialog
        ref={drawerRef}
        aria-label="Navigation menu"
        onClick={handleBackdropClick}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[80vw] bg-transparent p-0 backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col bg-card p-4 text-foreground shadow-xl">
          <div className="flex items-center justify-between">
            <Brand onNavigate={handleCloseDrawer} />
            <button
              type="button"
              onClick={handleCloseDrawer}
              aria-label="Close navigation menu"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Main" className="mt-8">
            <NavLinks onNavigate={handleCloseDrawer} />
          </nav>
          <UserSection />
        </div>
      </dialog>

      {/* Content */}
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
