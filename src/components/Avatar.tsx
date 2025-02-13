import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg'; // sizeはオプションにしてデフォルト値を設定
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md' }) => {
  // sizeに応じたTailwind CSSのクラスを設定
  const sizeClasses: { [key in 'sm' | 'md' | 'lg']: string } = {
    sm: 'w-4 h-4',  // small size
    md: 'w-8 h-8',  // medium size
    lg: 'w-16 h-16', // large size
  };

  const imageUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${name}&backgroundColor=f472b6,facc15,60a5fa,4ade80,c084fc&eyesColor=ffffff&mouthColor=ffffff&shapeColor[]`;

  return (
    <img
      src={imageUrl}
      alt="^_^"
      className={`select-none aspect-square bg-white flex items-center justify-center bg-yellow-400 text-white font-bold text-base rounded-full ${sizeClasses[size]}`} // Tailwindのクラスを適用
    />
  );
};

export default Avatar;