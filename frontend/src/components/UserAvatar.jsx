import React, { useState, useEffect } from 'react';
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
  const [imgError, setImgError] = useState(false);

  const rawAvatar = typeof user === 'object' && user ? user.avatar : null;

  useEffect(() => {
    setImgError(false);
  }, [rawAvatar]);

  const avatarSrc = showImage && !imgError && rawAvatar ? rawAvatar : null;
  const displayName =
    name ||
    (typeof user === 'string' ? user : (user?.name || user?.email)) ||
    'User';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${rounded} overflow-hidden shrink-0 select-none ${bgClassName} ${size} ${className}`}
      title={typeof user === 'object' && user?.name ? user.name : displayName}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={typeof user === 'object' && user?.name ? user.name : displayName}
          className={`w-full h-full object-cover ${rounded}`}
          onError={() => setImgError(true)}
          loading="lazy"
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

