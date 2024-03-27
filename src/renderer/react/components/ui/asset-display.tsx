import type { Asset } from '@elek-io/shared';
import { FolderArchive } from 'lucide-react';

export interface AssetDisplayProps extends Asset {
  preview?: boolean;
}

export function AssetDisplay(props: AssetDisplayProps) {
  switch (props.mimeType) {
    case 'image/avif':
    case 'image/gif':
    case 'image/jpeg':
    case 'image/png':
    case 'image/svg+xml':
    case 'image/webp':
      return (
        <img
          src={props.absolutePath}
          alt={`Asset "${props.name}"`}
          className="max-w-full max-h-full object-contain"
        />
      );
    case 'application/pdf':
      return (
        <embed
          src={props.absolutePath}
          type={props.mimeType}
          className="w-full h-full object-contain overflow-hidden"
        ></embed>
      );
    case 'application/zip':
      return <FolderArchive className="w-10 h-10"></FolderArchive>;
    case 'video/mp4':
    case 'video/webm':
      return (
        <video muted controls={props.preview} autoPlay={props.preview}>
          <source src={props.absolutePath} type={props.mimeType}></source>
        </video>
      );
    case 'audio/webm':
    case 'audio/flac':
      return (
        <audio muted controls={props.preview} autoPlay={props.preview}>
          <source src={props.absolutePath} type={props.mimeType}></source>
        </audio>
      );

    default:
      return `Mime type "${props.mimeType}" not supported`;
  }
}
