import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/farms')({
  component: FarmsLayout,
})

function FarmsLayout() {
  return <Outlet />
}