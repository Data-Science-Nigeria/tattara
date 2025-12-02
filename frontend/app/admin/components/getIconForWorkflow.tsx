import { FileText, Mic, Image } from 'lucide-react';

export const getIconForWorkflow = (enabledModes?: string[]) => {
  if (!enabledModes || enabledModes.length === 0) return FileText;

  const mode = enabledModes[0]; // Use first enabled mode

  switch (mode) {
    case 'audio':
      return Mic;
    case 'image':
      return Image;
    case 'text':
    default:
      return FileText;
  }
};
