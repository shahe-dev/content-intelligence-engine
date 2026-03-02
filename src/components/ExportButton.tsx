'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type ExportButtonProps<T> = {
  data: T[];
  filename?: string;
};

// A simple JSON to CSV converter
function convertToCSV<T extends object>(data: T[]): string {
  if (data.length === 0) {
    return '';
  }
  const keys = Object.keys(data[0]) as (keyof T)[];
  const header = keys.join(',') + '\n';
  const rows = data
    .map((row) => {
      return keys
        .map((key) => {
          let cell = String(row[key] ?? '');
          cell = cell.includes(',') ? `"${cell}"` : cell;
          return cell;
        })
        .join(',');
    })
    .join('\n');
  return header + rows;
}

export function ExportButton<T extends object>({
  data,
  filename = 'export.csv',
}: ExportButtonProps<T>) {
  const handleExport = () => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2" />
      Export to CSV
    </Button>
  );
}
