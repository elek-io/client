import { FileQuestion, FolderArchive } from 'lucide-react';
import { forwardRef, useEffect, useRef } from 'react';

import { cn } from '@renderer/lib/utils';

import { type Asset } from '@elek-io/core';

export function AssetDisplay(
  props: Asset & {
    className?: string | undefined;
    /**
     * If set to true, GIFs will be displayed as static images (no animation).
     * Video and audio files will be displayed without controls and not be played automatically.
     */
    static?: boolean;
  }
): React.JSX.Element {
  const absolutePath = 'elek-io-local-file://' + props.absolutePath;
  const ref = useRef(null);

  if (props.mimeType === 'image/gif' && props.static === true) {
    const gif = new Image();
    gif.src = absolutePath;

    const StaticGifCanvas = forwardRef<HTMLCanvasElement>(
      (_props, forwardedRef) => {
        if (typeof forwardedRef === 'function') {
          throw new Error(
            `Only React Refs that are created with createRef or useRef are supported`
          );
        }

        useEffect(() => {
          const context = forwardedRef?.current?.getContext('2d');
          if (!context) {
            return undefined;
          }

          context.drawImage(gif, 0, 0);
        }, [forwardedRef]);

        return (
          <canvas
            ref={forwardedRef}
            width={gif.width}
            height={gif.height}
            className={cn('h-full w-full object-contain', props.className)}
          />
        );
      }
    );
    StaticGifCanvas.displayName = 'StaticGifCanvas';

    return (
      <div className="flex aspect-4/3 basis-full">
        <StaticGifCanvas ref={ref} />
      </div>
    );
  }

  if (props.mimeType.startsWith('image/')) {
    return (
      <div className="flex aspect-4/3 basis-full">
        <img
          src={absolutePath}
          alt={`Asset "${props.name}"`}
          className={cn('h-full w-full object-contain', props.className)}
        />
      </div>
    );
  }

  if (props.mimeType.startsWith('video/')) {
    return (
      <div className="flex aspect-4/3 basis-full">
        <video
          muted
          controls={!props.static}
          autoPlay={!props.static}
          className={cn('', props.className)}
        >
          <source src={absolutePath} type={props.mimeType} />
        </video>
      </div>
    );
  }

  if (props.mimeType.startsWith('audio/')) {
    return (
      <div className="flex aspect-4/3 basis-full">
        <audio
          muted
          controls={!props.static}
          autoPlay={!props.static}
          className={cn('', props.className)}
        >
          <source src={absolutePath} type={props.mimeType} />
        </audio>
      </div>
    );
  }

  if (props.mimeType === 'application/pdf') {
    return (
      <div className="flex aspect-4/3 basis-full">
        <embed
          src={absolutePath}
          type={props.mimeType}
          className={cn('h-full w-full object-contain', props.className)}
        />
      </div>
    );
  }

  if (props.mimeType === 'application/zip') {
    return (
      <div className="flex aspect-4/3 basis-full">
        <FolderArchive className="m-auto h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="flex aspect-4/3 basis-full">
      <FileQuestion className="m-auto h-10 w-10" />
    </div>
  );
}
