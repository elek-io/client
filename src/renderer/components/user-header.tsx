import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Fragment } from 'react/jsx-runtime';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@renderer/components/ui/breadcrumb';
import { Button } from '@renderer/components/ui/button';
import { ButtonGroup } from '@renderer/components/ui/button-group';
import {
  UserDropdown,
  UserDropdownSkeleton,
} from '@renderer/components/user-dropdown';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useUser } from '@renderer/hooks/useUser';

export function UserHeader(): React.JSX.Element {
  const router = useRouter();
  const {
    userQuery: { data: user, isPending: isGettingUser },
  } = useUser();
  const { breadcrumbs } = useBreadcrumb();

  return (
    <div className="flex w-full border-b bg-sidebar">
      <div className="flex w-60 shrink-0 border-r p-2" />
      <div className="flex flex-1 items-center p-1">
        <div className="flex flex-1 items-center">
          <ButtonGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.history.back()}
              Icon={ArrowLeft}
            >
              <span className="sr-only">Go back</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.history.forward()}
              Icon={ArrowRight}
            >
              <span className="sr-only">Go forward</span>
            </Button>
          </ButtonGroup>

          <Breadcrumb className="ml-4 flex flex-1">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index, array) => (
                <Fragment key={crumb.path}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {array.length !== index + 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {isGettingUser ? (
          <UserDropdownSkeleton />
        ) : user === null ? null : (
          <UserDropdown user={user} />
        )}
      </div>
    </div>
  );
}
