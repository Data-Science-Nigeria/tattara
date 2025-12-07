import Image from 'next/image';

const DocumentIcon = ({ className }: { className?: string }) => (
  <Image
    src="/document-text.svg"
    alt="Document"
    width={20}
    height={20}
    className={className}
  />
);

export const getIconForProgram = () => {
  return DocumentIcon;
};
