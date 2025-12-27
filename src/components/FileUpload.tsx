'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      await onUpload(file);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-gray-500 mt-1">PDF documents only</p>
        </div>
      ) : (
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <File className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {status === 'idle' && (
              <button
                onClick={removeFile}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
          </div>

          {status === 'idle' && (
            <button
              onClick={handleUpload}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Process Document
            </button>
          )}

          {status === 'uploading' && (
            <button
              disabled
              className="w-full py-2 px-4 bg-blue-100 text-blue-600 font-medium rounded-lg flex items-center justify-center space-x-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing Document...</span>
            </button>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Failed to process document. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
