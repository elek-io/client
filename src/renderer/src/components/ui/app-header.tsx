import { Ipc } from '@renderer/ipc';
import { cn } from '@renderer/util';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { forwardRef, HTMLAttributes, useState } from 'react';
import {
  version as clientVersion,
  dependencies,
} from '../../../../../package.json';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  electron: Ipc['electron'];
}

const AppHeader = forwardRef<HTMLInputElement, AppHeaderProps>(
  ({ electron }, ref) => {
    const [isElekInfoOpen, setIsElekInfoOpen] = useState(false);

    return (
      <header
        ref={ref}
        className="w-full window-draggable-area bg-white dark:bg-zinc-900"
      >
        <div
          id="app-bar"
          className="p-2 text-sm text-center border-b border-zinc-200 dark:border-zinc-800"
        >
          <h1>
            <DropdownMenu
              open={isElekInfoOpen}
              onOpenChange={setIsElekInfoOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size={'sm'}>
                  elek.<span className="text-brand-600">io</span>
                  <strong className="ml-2 text-xs">Client</strong>
                  <ChevronDown
                    className={cn(
                      'ml-2 h-4 w-4 transition',
                      isElekInfoOpen && 'rotate-180'
                    )}
                  ></ChevronDown>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-4 mr-2 window-not-draggable-area">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      window.open(
                        'https://github.com/elek-io/client/issues',
                        '_blank'
                      )
                    }
                  >
                    Report an issue
                    <DropdownMenuShortcut>
                      <ExternalLink className="w-4 h-4"></ExternalLink>
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    elek.io Client
                    <DropdownMenuShortcut>
                      v{clientVersion}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    elek.io Core
                    <DropdownMenuShortcut>
                      v{dependencies['@elek-io/core']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Electron
                    <DropdownMenuShortcut>
                      v{electron.process.versions['electron']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Chromium
                    <DropdownMenuShortcut>
                      v{electron.process.versions['chrome']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Node
                    <DropdownMenuShortcut>
                      v{electron.process.versions['node']}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </h1>
        </div>
      </header>
    );
  }
);
AppHeader.displayName = 'AppHeader';

export { AppHeader };
