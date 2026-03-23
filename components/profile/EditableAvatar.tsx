'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface EditableAvatarProps {
  currentImage?: string | null;
  initials: string;
}

export function EditableAvatar({ currentImage, initials }: EditableAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localImage, setLocalImage] = useState(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Размер файла слишком большой. Максимум 10 МБ.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/me/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload error');
      }

      setLocalImage(data.imageUrl);
      router.refresh();
    } catch (e: any) {
      alert("Ошибка при загрузке: " + e.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="cabinet-avatar-container" 
      style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
      onClick={() => fileInputRef.current?.click()}
      title="Нажмите, чтобы изменить аватар"
    >
      <input 
        type="file" 
        accept="image/jpeg,image/png,image/webp,image/gif"
        ref={fileInputRef} 
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {localImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={localImage}
          alt="Avatar"
          width={80}
          height={80}
          className="cabinet-avatar-lg"
          style={{ objectFit: 'cover', opacity: isUploading ? 0.5 : 1 }}
        />
      ) : (
        <div className="cabinet-avatar-lg" style={{ opacity: isUploading ? 0.5 : 1 }}>
          {initials}
        </div>
      )}
      {isUploading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ color: 'white', fontSize: 24, textShadow: '0 0 5px rgba(0,0,0,0.5)' }} />
        </div>
      )}
      {!isUploading && (
        <div className="cabinet-avatar-overlay" style={{
          position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-primary)', 
          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', color: 'white', fontSize: 12, border: '2px solid var(--studio-panel-bg)'
        }}>
          <i className="fa-solid fa-camera" />
        </div>
      )}
    </div>
  );
}
