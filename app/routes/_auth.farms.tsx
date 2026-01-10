import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/farms')({
  component: FarmsLayout,
})

function FarmsLayout() {
  return <Outlet />
}
