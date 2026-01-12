import React from 'react';
import DataTable from './DataTable';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Edit2, Trash2, Eye } from 'lucide-react';

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
  // Add action column if onEdit or onDelete are provided
  const tableColumns = [...columns];
  
  if (onEdit || onDelete || onView) {
    tableColumns.push({
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex space-x-2">
          {onView && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(item)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    });
  }

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
