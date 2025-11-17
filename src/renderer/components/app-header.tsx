import { version as clientVersion, dependencies } from '@root/package.json';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { forwardRef, type HTMLAttributes, useState } from 'react';

import { Button } from '@renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuAddOn,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { cn } from '@renderer/lib/utils';
import { type RouterContext } from '@renderer/routes/__root';

export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  electron: RouterContext['electron'];
}

const AppHeader = forwardRef<HTMLInputElement, AppHeaderProps>(
  ({ electron }, ref) => {
    const [isElekInfoOpen, setIsElekInfoOpen] = useState(false);

    return (
      <header ref={ref} className="window-draggable-area w-full bg-sidebar">
        <div id="app-bar" className="border-b p-2 text-center text-sm">
          <DropdownMenu open={isElekInfoOpen} onOpenChange={setIsElekInfoOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-0">
                <h1>
                  elek.<span className="text-primary">io</span>
                  <strong className="ml-2 text-xs">Client</strong>
                </h1>
                <ChevronDown
                  className={cn(
                    'ml-2 h-4 w-4 transition',
                    isElekInfoOpen && 'rotate-180'
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="window-not-draggable-area mt-4 mr-2 w-56">
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
                  <DropdownMenuAddOn>
                    <ExternalLink className="h-4 w-4" />
                  </DropdownMenuAddOn>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  elek.io Client
                  <DropdownMenuAddOn>v{clientVersion}</DropdownMenuAddOn>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  elek.io Core
                  <DropdownMenuAddOn>
                    v{dependencies['@elek-io/core']}
                  </DropdownMenuAddOn>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  Electron
                  <DropdownMenuAddOn>
                    v{electron.process.versions['electron']}
                  </DropdownMenuAddOn>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Chromium
                  <DropdownMenuAddOn>
                    v{electron.process.versions['chrome']}
                  </DropdownMenuAddOn>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Node
                  <DropdownMenuAddOn>
                    v{electron.process.versions['node']}
                  </DropdownMenuAddOn>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  }
);
AppHeader.displayName = 'AppHeader';

export { AppHeader };
