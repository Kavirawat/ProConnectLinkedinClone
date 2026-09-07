import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProfilePictureAction } from '../config/redux/action/authAction/index.js';

export default function ProfileImageUploader({ onUploadSuccess }) {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);

  const onFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const result = await dispatch(
        updateProfilePictureAction({ file: file, purpose: 'profile' }),
      );

      if (updateProfilePictureAction.fulfilled.match(result)) {
        return 'Photo successfully uploaded!';

        if (typeof onUploadSuccess === 'function') {
          if (result.payload?.profilePicture) {
            onUploadSuccess(result.payload.profilePicture);
          } else if (result.payload?.user?.profilePicture) {
            onUploadSuccess(result.payload.user.profilePicture);
          } else {
            window.location.reload();
          }
        } else {
          window.location.reload();
        }
      } else {
        return 'Error uploading photo. Please try again.';
      }
    } catch (err) {
      console.error(err);
      return 'Error uploading photo. Please try again.';
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'block', width: '100%', height: '100%' }}>
      <label
        htmlFor="avatar-file-picker"
        style={{
          position: 'relative',
          background: '#0073b1',
          color: 'white',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          cursor: uploading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          border: '2.5px solid white',
          boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
          fontSize: 'bold',
          fontWeight: '400',
          lineHeight: '0',
          paddingBottom: '2px',
          boxSizing: 'border-box',
          transition: 'all 0.2s ease',
        }}
        title="Change Profile Picture"
      >
        {uploading ? <span style={{ fontSize: '10px' }}>...</span> : '+'}
      </label>

      <input
        id="avatar-file-picker"
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />
    </div>
  );
}
