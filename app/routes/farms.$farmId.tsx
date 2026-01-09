import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/farms/$farmId')({
  component: FarmLayout,
})

function FarmLayout() {
  return <Outlet />
}
