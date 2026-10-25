import { useRef, useState } from 'react';

export function UploadDropzone({ onUpload, isUploading }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onUpload(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone--active' : ''} ${isUploading ? 'dropzone--busy' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <div className="dropzone__icon" aria-hidden>
        {isUploading ? <span className="spinner" /> : '📄'}
      </div>
      <div>
        <strong>{isUploading ? 'Lendo seu extrato…' : 'Importar extrato em PDF'}</strong>
        <p className="muted">
          {isUploading ? 'Extraindo texto, identificando e categorizando transações' : 'Arraste o arquivo aqui ou clique para selecionar'}
        </p>
      </div>
    </div>
  );
}
