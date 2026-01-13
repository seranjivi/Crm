import React, { useRef } from 'react';
import { Button } from '../ui/button';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { toast } from 'sonner';
 
const MultiFileUpload = ({ files, onChange, maxSizePerFile = 10 }) => {
  const fileInputRef = useRef(null);
 
  const ACCEPTED_TYPES = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'text/plain': '.txt',
    'text/csv': '.csv'
  };
 
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const validFiles = [];
    const maxSize = maxSizePerFile * 1024 * 1024; // Convert to bytes
 
    for (const file of selectedFiles) {
      // Check file type
      if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV allowed.`);
        continue;
      }
 
      // Check file size
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Max size is ${maxSizePerFile}MB.`);
        continue;
      }
 
      validFiles.push(file);
    }
 
    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added successfully`);
    }
 
    // Reset input
    event.target.value = '';
  };
 
  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
    toast.success('File removed');
  };
 
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
 
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-slate-500" />;
  };
 
  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div className="flex flex-col items-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.values(ACCEPTED_TYPES).join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 text-xs mx-auto"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Choose Files
        </Button>
        <p className="text-xs text-slate-500 mt-1 text-center">
          PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV • Max {maxSizePerFile}MB per file
        </p>
      </div>
 
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">
            Selected Files ({files.length})
          </p>
          <div className="space-y-1.5">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
 
export default MultiFileUpload;
 