import React from 'react';
import DataTable from './DataTable';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Edit2, Trash2, Eye, Plus } from 'lucide-react';
 
export const statusBadgeVariant = (status) => {
  const statusMap = {
    'Active': 'success',
    'Inactive': 'secondary',
    'Pending': 'warning',
    'Draft': 'outline',
    'Completed': 'success',
    'In Progress': 'info',
    'On Hold': 'warning',
    'Cancelled': 'destructive',
  };
  return statusMap[status] || 'default';
};
 
const StandardDataTable = ({
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
  title,
  addButtonText = 'Add New',
  onAddNew,
  loading = false
}) => {
  // Use the provided columns directly
  // The DataTable component will handle adding the Actions column
  const tableColumns = [...columns];
 
  // Format data for status badges
  const formattedData = data.map(item => {
    const formattedItem = { ...item };
    columns.forEach(col => {
      if (col.key === 'status' || col.key.endsWith('_status')) {
        formattedItem[col.key] = (
          <Badge variant={statusBadgeVariant(item[col.key])}>
            {item[col.key]}
          </Badge>
        );
      }
    });
    return formattedItem;
  });
 
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {onAddNew && (
          <Button onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </div>
     
      <DataTable
        data={formattedData}
        columns={tableColumns}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        onExport={onExport}
        onImport={onImport}
        testId={testId}
        filterOptions={filterOptions}
        ColumnFilterComponent={ColumnFilterComponent}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        loading={loading}
      />
    </div>
  );
};
 
export default StandardDataTable;
 
 