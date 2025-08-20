import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import "../styles/main.css"

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>{' '}
        <Link to="/calcs" className="[&.active]:font-bold">
          Calcs
        </Link>
      </div>
      <hr />
      <br />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})