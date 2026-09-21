import React from 'react';
import { Blobatar } from '@blobatar/react';
import 'blobatar/motion.css';

/**
 * Reusable animated avatar component using @blobatar/react
 * Deterministically generates cute geometric animated blobatars with continuous idle & hover motion
 */
export default function UserAvatar({
  user,
  name,
  size = 'w-10 h-10',
  rounded = 'rounded-full',
  className = '',
  animate = 'always',
  bgClassName = 'bg-[#1C1B1A]',
  showImage = true,
  scale = 'scale-[1.18]',
}) {
  const avatarSrc = showImage ? user?.avatar : null;
  const displayName = name || user?.name || user?.email || 'alain00';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${rounded} overflow-hidden shrink-0 select-none ${bgClassName} ${size} ${className}`}
      title={user?.name || displayName}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={user?.name || displayName}
          className={`w-full h-full object-cover ${rounded}`}
        />
      ) : (
        <div className="w-full h-full p-0.5 flex items-center justify-center overflow-hidden">
          <Blobatar
            name={displayName}
            animate={animate}
            className={`w-full h-full select-none ${scale} transition-transform`}
          />
        </div>
      )}
    </div>
  );
}
