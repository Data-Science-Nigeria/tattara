interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar = ({ name, size = 'md' }: AvatarProps) => {
  const getInitial = (fullName: string) => {
    const names = fullName.trim().split(' ');
    return names[names.length - 1]?.[0]?.toUpperCase() || 'U';
  };

  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${getBackgroundColor(name)} flex items-center justify-center rounded-full font-semibold text-white`}
    >
      {getInitial(name)}
    </div>
  );
};

export default Avatar;
