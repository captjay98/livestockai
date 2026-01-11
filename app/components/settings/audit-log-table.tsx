import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import type { AuditLogResult } from '~/lib/logging/audit'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

interface AuditLogTableProps {
  logs: AuditLogResult['data']
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AuditLogTable({
  logs,
  page,
  totalPages,
  onPageChange,
}: AuditLogTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.userName}</span>
                      {log.ipAddress && (
                        <span className="text-[10px] text-muted-foreground">
                          {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.action === 'create'
                          ? 'success'
                          : log.action === 'delete'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="capitalize"
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="capitalize font-medium">
                        {log.entityType}
                      </span>
                      <span
                        className="text-xs text-muted-foreground truncate max-w-[150px]"
                        title={log.entityId}
                      >
                        {log.entityId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.details ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Change Details</DialogTitle>
                          </DialogHeader>
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
                            {JSON.stringify(
                              typeof log.details === 'string'
                                ? JSON.parse(log.details)
                                : log.details,
                              null,
                              2,
                            )}
                          </pre>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
