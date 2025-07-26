import React, { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';

export default function DataTable({ data = [], columns = [] }) {
  const [sorting, setSorting] = useState([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>{hg.headers.map(h => (
              <th key={h.id} scope="col" className="px-6 py-3">
                <div className={h.column.getCanSort() ? 'cursor-pointer select-none' : ''} onClick={h.column.getToggleSortingHandler()}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: ' ▲', desc: ' ▼'}[h.column.getIsSorted()] ?? null}
                </div>
              </th>))}
            </tr>))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}