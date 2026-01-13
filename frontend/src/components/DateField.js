
 
import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Calendar } from 'lucide-react';
import { formatDate, getTodayFormatted } from '../utils/dateUtils';
 
/**
 * Editable Date field component for forms
 * Allows users to select a date using a date picker
 * Shows created date for existing records or today's date for new records as default
 * @param {Object} props - Component props
 * @param {string} [props.createdAt] - The creation date of the record
 * @param {boolean} [props.isNew=false] - Whether this is a new record
 * @param {string} props.value - The current value of the date field
 * @param {Function} props.onChange - Handler for when the date changes
 * @param {string} [props.name="date"] - Name of the input field
 * @param {string} [props.label] - Optional label (set to null to hide the label)
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {boolean} [props.disabled=false] - Whether the field is disabled
 * @param {boolean} [props.readOnly=false] - Whether the field is read-only
 */
const DateField = ({
  createdAt,
  isNew = false,
  value,
  onChange,
  name = "date",
  label = null,
  required = false,
  disabled = false,
  readOnly = false
}) => {
  // If readOnly or disabled prop is explicitly passed as true, show read-only field
  if (readOnly || disabled) {
    const displayDate = isNew ? getTodayFormatted() : formatDate(createdAt);
    return (
      <div>
        <Label htmlFor="createdDate">{label}</Label>
        <div className="relative">
          <Input
            id="createdDate"
            value={displayDate}
            readOnly
            disabled
            className="bg-slate-50 cursor-not-allowed text-slate-600"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isNew ? 'Will be set to today\'s date when saved' : 'Record created on this date'}
        </p>
      </div>
    );
  }
 
  // Editable date field
  // Convert date to YYYY-MM-DD format for input[type="date"]
  const getInputValue = () => {
    if (value) {
      // If value is already in YYYY-MM-DD format
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return value;
      }
      // If value is ISO string, extract date part
      if (typeof value === 'string' && value.includes('T')) {
        return value.split('T')[0];
      }
      return value;
    }
   
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
 
  const handleDateChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };
 
  // Create a ref for the date input
  const dateInputRef = React.useRef(null);
 
  // Handle click on the calendar icon
  const handleCalendarClick = () => {
    if (dateInputRef.current && !disabled) {
      dateInputRef.current.showPicker();
    }
  };
 
  const inputField = (
    <div className="relative">
      <Input
        ref={dateInputRef}
        id={name}
        name={name}
        type="date"
        value={getInputValue()}
        onChange={handleDateChange}
        required={required}
        disabled={disabled}
        className="cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-datetime-edit]:w-full"
        data-testid={`${name}-input`}
        placeholder={label || 'Select date'}
      />
      <div
        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
        onClick={handleCalendarClick}
        aria-hidden="true"
      >
        <Calendar className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
 
  // If no label is provided, just return the input field
  if (label === null) {
    return inputField;
  }
 
  // Otherwise, wrap it with a label
  return (
    <div>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {inputField}
    </div>
  );
};
 
export default DateField;
 
 