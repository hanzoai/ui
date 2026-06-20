// FileTypeIcon component
import React from 'react';
import { cn } from '../src/utils';
import { FileIcon, FolderIcon, ImageIcon, FileTextIcon, FileCodeIcon, FileArchiveIcon } from 'lucide-react';

export interface FileTypeIconProps extends React.SVGProps<SVGSVGElement> {
  type?: string;
}

const getIconForType = (type?: string) => {
  if (!type) return FileIcon;

  const lowerType = type.toLowerCase();

  // Image files
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(lowerType)) {
    return ImageIcon;
  }

  // Document files
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(lowerType)) {
    return FileTextIcon;
  }

  // Code files
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'rs', 'go'].includes(lowerType)) {
    return FileCodeIcon;
  }

  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(lowerType)) {
    return FileArchiveIcon;
  }

  return FileIcon;
};

export const FileTypeIcon = React.forwardRef<SVGSVGElement, FileTypeIconProps>(
  ({ type, className, ...props }, ref) => {
    const Icon = getIconForType(type);

    return (
      <Icon
        ref={ref}
        className={cn("h-4 w-4", className)}
        {...props}
      />
    );
  }
);

FileTypeIcon.displayName = 'FileTypeIcon';

export const DirectoryTypeIcon = React.forwardRef<SVGSVGElement, Omit<FileTypeIconProps, 'type'>>(
  ({ className, ...props }, ref) => {
    return (
      <FolderIcon
        ref={ref}
        className={cn("h-4 w-4", className)}
        {...props}
      />
    );
  }
);

DirectoryTypeIcon.displayName = 'DirectoryTypeIcon';