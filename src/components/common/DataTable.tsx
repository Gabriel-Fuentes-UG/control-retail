// src/components/common/DataTable.tsx
"use client";
import { useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, SortingState, ColumnDef } from '@tanstack/react-table';
import { Table, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';

// Añadimos la propiedad 'meta' para pasar datos extra como nuestra función de refresco
type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  meta?: any;
};

export default function DataTable<TData>({ columns, data, meta }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
        pagination: {
            pageSize: 15, // Paginación cada 15 usuarios
        }
    }
  });

  return (
    <div>
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Buscar en toda la tabla..."
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              value={globalFilter}
            />
          </InputGroup>
        </Col>
      </Row>

      <Table striped bordered hover responsive>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} onClick={header.column.getToggleSortingHandler()} style={{ cursor: 'pointer' }}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
                </tr>
            ))
          ) : (
            <tr>
                <td colSpan={columns.length} className="text-center">No se encontraron resultados.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
        <Button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}> {'<<'} </Button>
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}> Anterior </Button>
        <span className="mx-2">Página{' '}<strong>{table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}</strong></span>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}> Siguiente </Button>
        <Button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}> {'>>'} </Button>
      </div>
    </div>
  );
}