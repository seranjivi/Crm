import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, ChevronLeft, ChevronRight, Download, Filter, Edit2, Trash2, FilterX, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
 
const DataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onView,
  onExport,
  onImport,
  testId,
  filterOptions = {},
  ColumnFilterComponent,
  activeFilters = [],
  onFilterChange,
  renderToolbarActions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const itemsPerPage = 10;
 
  // Apply filters
  let filteredData = data.filter((item) => {
    // Search filter
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = columns.some((col) => {
      const value = item[col.key];
      return value?.toString().toLowerCase().includes(searchStr);
    });
 
    if (!matchesSearch) return false;
 
    return true;
  });
 
  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
 
  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
 
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
 
  const handleExport = () => {
    if (onExport) {
      onExport(sortedData);
    } else {
      // Default CSV export
      const csvContent = [
        columns.map((col) => col.header).join(','),
        ...sortedData.map((row) => columns.map((col) => {
          const val = row[col.key] || '';
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${Date.now()}.csv`;
      a.click();
    }
  };
 
  return (
    <div className="space-y-3" data-testid={testId}>
      {/* Toolbar - Compact */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow max-w-md">
            {/* <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <Input
              placeholder="Searchs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="table-search-input"
              className="pl-9 h-8 text-sm w-full"
            /> */}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onExport && (
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              Export
            </Button>
          )}
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport} className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1 rotate-180" />
              Import
            </Button>
          )}
        </div>
      </div>
 
      {/* Table - Compact */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="font-semibold text-slate-700 whitespace-nowrap px-4 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-1">
                    <div
                      className="flex items-center gap-1 cursor-pointer hover:text-[#2C6AA6]"
                      onClick={() => handleSort(col.key)}
                    >
                      <span>{col.header}</span>
                      {sortConfig.key === col.key && (
                        <span className="text-[#2C6AA6] font-bold">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    {/* Column Filter Icon */}
                    {ColumnFilterComponent && col.filterable && (
                      <ColumnFilterComponent
                        column={col}
                        data={data}
                        onFilterChange={onFilterChange}
                        activeFilters={activeFilters}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
              {(onEdit || onView || onDelete) && (
                <TableHead className="font-semibold text-slate-700 whitespace-nowrap px-4 py-2.5 text-xs">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-6 text-slate-500 px-4 text-sm">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow key={row.id || index} className="hover:bg-slate-50/50">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="whitespace-nowrap px-4 py-2.5 text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                  {(onEdit || onView || onDelete) && (
                    <TableCell className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(row)}
                            data-testid={`view-btn-${row.id}`}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(row)}
                            data-testid={`edit-btn-${row.id}`}
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-600 hover:bg-green-50"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(row)}
                            data-testid={`delete-btn-${row.id}`}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
 
      {/* Pagination - Compact */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} results
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="table-prev-page"
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center px-2">
              <span className="text-xs text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              data-testid="table-next-page"
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default DataTable;