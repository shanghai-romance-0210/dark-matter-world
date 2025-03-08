import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | "text";
  className?: string;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  icon,
  variant = 'primary',
  className = '',
  iconPosition = 'left',
  children,
  size = 'md',
}) => {
  const baseStyles = 'flex items-center rounded-full whitespace-nowrap active:scale-90 duration-200 px-4 py-2';

  const variantStyles = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-blue-50 text-blue-600',
    danger: 'bg-red-50 text-red-600',
    outline: 'bg-white text-zinc-600 border border-zinc-200',
    text: "bg-transparent text-zinc-600"
  };

  const sizeStyles = {
    sm: 'text-sm h-9',
    md: 'text-base h-10',
    lg: 'text-lg h-11',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;