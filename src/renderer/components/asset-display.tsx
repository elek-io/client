import { FileQuestion, FolderArchive } from 'lucide-react';
import { forwardRef, useEffect, useRef } from 'react';

import { cn } from '@renderer/lib/utils';

import { type Asset } from '@elek-io/core';

export function AssetDisplay(
  props: Asset & {
    className?: string;
    /**
     * If set to true, GIFs will be displayed as static images (no animation).
     * Video and audio files will be displayed without controls and not be played automatically.
     */
    static: boolean;
  }
): React.JSX.Element {
  const absolutePath = 'elek-io-local-file://' + props.absolutePath;
  const ref = useRef(null);

  if (props.mimeType === 'image/gif' && props.static === true) {
    const gif = new Image();
    gif.src = absolutePath;

    const StaticGifCanvas = forwardRef<HTMLCanvasElement>((_props, ref) => {
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
      }, [ref]);

      return (
        <canvas
          ref={ref}
          width={gif.width}
          height={gif.height}
          className={cn('h-full w-full object-contain', props.className)}
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
        className={cn('h-full w-full object-contain', props.className)}
      />
    );
  }

  if (props.mimeType.startsWith('video/')) {
    return (
      <video
        muted
        controls={!props.static}
        autoPlay={!props.static}
        className={cn('', props.className)}
      >
        <source src={absolutePath} type={props.mimeType} />
      </video>
    );
  }

  if (props.mimeType.startsWith('audio/')) {
    return (
      <audio
        muted
        controls={!props.static}
        autoPlay={!props.static}
        className={cn('', props.className)}
      >
        <source src={absolutePath} type={props.mimeType} />
      </audio>
    );
  }

  if (props.mimeType === 'application/pdf') {
    return (
      <embed
        src={absolutePath}
        type={props.mimeType}
        className={cn('h-full w-full object-contain', props.className)}
      />
    );
  }

  if (props.mimeType === 'application/zip') {
    return <FolderArchive className="h-10 w-10" />;
  }

  return <FileQuestion className="h-10 w-10" />;
}
