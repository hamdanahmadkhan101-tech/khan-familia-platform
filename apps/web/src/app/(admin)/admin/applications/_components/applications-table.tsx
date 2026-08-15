'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@khan-familia/ui';
import { Badge } from '@khan-familia/ui';
import { ApplicationDetailsSheet } from './application-details-sheet';

// Lightweight local type for the table
export type ApplicationData = {
  id: string;
  businessName: string;
  fullName: string;
  user?: { email: string };
  email?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  phone?: string | null;
  country?: string;
  businessVertical?: string | null;
  businessRegNumber?: string;
  govIdType?: string;
  govIdNumber?: string;
  documents?: { url: string; [key: string]: unknown }[];
  // Other fields exist but are omitted here for brevity
  [key: string]: unknown;
};

interface ApplicationsTableProps {
  data: ApplicationData[];
}

export function ApplicationsTable({ data }: ApplicationsTableProps) {
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);

  const columns: ColumnDef<ApplicationData>[] = [
    {
      accessorKey: 'businessName',
      header: 'Business Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('businessName')}</div>,
    },
    {
      accessorKey: 'fullName',
      header: 'Applicant Name',
    },
    {
      accessorFn: (row) => row.user?.email || row.email || 'N/A',
      header: 'Email',
    },
    {
      accessorKey: 'createdAt',
      header: 'Applied On',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = String(row.getValue('status'));
        return (
          <Badge
            variant={
              status === 'PENDING' ? 'secondary' : status === 'APPROVED' ? 'default' : 'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => setSelectedApp(row.original)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No pending applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ApplicationDetailsSheet
        application={selectedApp}
        open={!!selectedApp}
        onOpenChange={(open) => !open && setSelectedApp(null)}
      />
    </div>
  );
}
