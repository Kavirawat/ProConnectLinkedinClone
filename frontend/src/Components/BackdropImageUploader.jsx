import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProfilePictureAction } from '../config/redux/action/authAction/index.js';

export default function BackdropImageUploader({ onUploadSuccess }) {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);

  const onFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const result = await dispatch(
        updateProfilePictureAction({
          file: file,
          purpose: 'cover',
        }),
      );

      if (updateProfilePictureAction.fulfilled.match(result)) {
        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess();
        } else {
          window.location.reload();
        }
      } else {
        alert(
          'Cover upload fail ho gaya: ' +
            (result.payload?.message || 'Server Configuration Error'),
        );
      }
    } catch (err) {
      console.error('Backdrop Upload Error:', err);
      alert('Upload karne mein dikkat aayi!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <label
        htmlFor="backdrop-file-picker"
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          border: '1px solid silver',
          zIndex: 110,
        }}
        title="Change Cover Picture"
      >
        {uploading ? (
          'Uploading...'
        ) : (
          <>
            <svg
              xmlns="http://w3.org"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              style={{ width: '18px', height: '18px' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            <span>Cover</span>
          </>
        )}
      </label>
      <input
        id="backdrop-file-picker"
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />
    </>
  );
}
