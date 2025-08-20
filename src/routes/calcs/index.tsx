import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/calcs/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div>Useful Calcs</div>
      <Link to="/calcs/dca" className="[&.active]:font-bold">
        Dollar Cost Average Calculator
      </Link>
      <Outlet />
    </>
  );
}
