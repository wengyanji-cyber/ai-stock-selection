import type { ReactNode } from 'react'

type DataTableProps = {
  headers: string[]
  rows: ReactNode[][]
  rowClassName?: string
}

function DataTable({ headers, rows, rowClassName }: DataTableProps) {
  return (
    <div className="table-shell">
      <div className={`table-head table-row ${rowClassName ?? ''}`.trim()}>
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>
      {rows.map((row, index) => (
        <div className={`table-row ${rowClassName ?? ''}`.trim()} key={index}>
          {row.map((cell, cellIndex) => (
            <div key={cellIndex}>{cell}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default DataTable