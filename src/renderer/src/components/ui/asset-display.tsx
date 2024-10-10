import { Asset } from '@elek-io/core';
import { FileQuestion, FolderArchive } from 'lucide-react';
import { forwardRef, useEffect, useRef } from 'react';

export interface AssetDisplayProps extends Asset {
  /**
   * If set to true, GIFs will be displayed as static images (no animation).
   * Video and audio files will be displayed without controls and not be played automatically.
   */
  static: boolean;
}

export function AssetDisplay(props: AssetDisplayProps): JSX.Element {
  const absolutePath = 'elek-io-local-file://' + props.absolutePath;

  if (props.mimeType === 'image/gif' && props.static === true) {
    const ref = useRef(null);
    const gif = new Image();
    gif.src = absolutePath;

    const StaticGifCanvas = forwardRef<HTMLCanvasElement>((props, ref) => {
      if (typeof ref === 'function') {
        throw new Error(
          `Only React Refs that are created with createRef or useRef are supported`
        );
      }

      useEffect(() => {
        const context = ref?.current?.getContext('2d');
        if (!context) {
          return undefined;
        }

        context.drawImage(gif, 0, 0);
      }, []);

      return (
        <canvas
          ref={ref}
          {...props}
          width={gif.width}
          height={gif.height}
          className="max-w-full max-h-full object-contain"
        />
      );
    });
    StaticGifCanvas.displayName = 'StaticGifCanvas';

    return <StaticGifCanvas ref={ref} />;
  }

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
      <video muted controls={!props.static} autoPlay={!props.static}>
        <source src={absolutePath} type={props.mimeType}></source>
      </video>
    );
  }

  if (props.mimeType.startsWith('audio/')) {
    return (
      <audio muted controls={!props.static} autoPlay={!props.static}>
        <source src={absolutePath} type={props.mimeType}></source>
      </audio>
    );
  }

  if (props.mimeType === 'application/pdf') {
    return (
      <embed
        src={absolutePath}
        type={props.mimeType}
        className="w-full h-full object-contain"
      />
    );
  }

  if (props.mimeType === 'application/zip') {
    return <FolderArchive className="w-10 h-10" />;
  }

  return <FileQuestion className="w-10 h-10" />;
}
