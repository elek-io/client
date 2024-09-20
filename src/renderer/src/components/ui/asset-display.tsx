import { Asset } from '@elek-io/core';
import { FileQuestion, FolderArchive } from 'lucide-react';

export interface AssetDisplayProps extends Asset {
  preview?: boolean;
}

export function AssetDisplay(props: AssetDisplayProps): JSX.Element {
  const absolutePath = 'elek-io-local-file://' + props.absolutePath;

  if (props.mimeType.startsWith('image/')) {
    return (
      <img
        src={absolutePath}
        alt={`Asset "${props.name}"`}
        className="max-w-full max-h-full object-contain"
      />
    );
  }

  if (props.mimeType.startsWith('video/')) {
    return (
      <video muted controls={props.preview} autoPlay={props.preview}>
        <source src={absolutePath} type={props.mimeType}></source>
      </video>
    );
  }

  if (props.mimeType.startsWith('audio/')) {
    return (
      <audio muted controls={props.preview} autoPlay={props.preview}>
        <source src={absolutePath} type={props.mimeType}></source>
      </audio>
    );
  }

  if (props.mimeType === 'application/pdf') {
    return (
      <embed
        src={absolutePath}
        type={props.mimeType}
        className="w-full h-full object-contain overflow-hidden"
      ></embed>
    );
  }

  if (props.mimeType === 'application/zip') {
    return <FolderArchive className="w-10 h-10" />;
  }

  return <FileQuestion className="w-10 h-10" />;
}
