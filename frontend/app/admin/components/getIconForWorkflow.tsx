import Image from 'next/image';

const TextIcon = ({ className }: { className?: string }) => (
  <Image
    src="/edit-2.svg"
    alt="Text"
    width={20}
    height={20}
    className={className}
  />
);

const AudioIcon = ({ className }: { className?: string }) => (
  <Image
    src="/microphone-2.svg"
    alt="Audio"
    width={20}
    height={20}
    className={className}
  />
);

const ImageIcon = ({ className }: { className?: string }) => (
  <Image
    src="/gallery.svg"
    alt="Image"
    width={20}
    height={20}
    className={className}
  />
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <Image
    src="/document-text.svg"
    alt="Document"
    width={20}
    height={20}
    className={className}
  />
);

export const getIconForWorkflow = (enabledModes?: string[]) => {
  if (!enabledModes || enabledModes.length === 0) return DocumentIcon;

  const mode = enabledModes[0]; // Use first enabled mode

  switch (mode) {
    case 'audio':
      return AudioIcon;
    case 'image':
      return ImageIcon;
    case 'text':
      return TextIcon;
    default:
      return DocumentIcon;
  }
};
