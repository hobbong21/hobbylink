import React, { useState, useRef } from 'react';
import axios from 'axios';

const ImageUpload = ({ 
  onImageUploaded, 
  currentImage, 
  category = 'profiles',
  placeholder = 'Upload Image',
  className = '',
  accept = 'image/*'
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.fileUrl) {
        onImageUploaded(response.data.fileUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-upload-container ${className}`}>
      <div
        className={`image-upload-area ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {currentImage ? (
          <div className="current-image-preview">
            <img src={currentImage} alt="Current" className="preview-image" />
            <div className="upload-overlay">
              <span className="upload-text">
                {uploading ? 'Uploading...' : 'Click or drag to change'}
              </span>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              {uploading ? 'Uploading...' : placeholder}
            </div>
            <div className="upload-hint">
              Click or drag image here
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}
      
      <div className="upload-info">
        <small>Supported formats: JPG, PNG, GIF, WebP (max 5MB)</small>
      </div>
    </div>
  );
};

export default ImageUpload;