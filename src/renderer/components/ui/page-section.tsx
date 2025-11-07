import { type HTMLAttributes, type ReactElement, type ReactNode } from 'react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';
import { cn } from '@renderer/lib/utils';

export interface PageSectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  title?: string;
  description?: string | ReactElement;
  actions?: ReactElement;
  standalone?: boolean;
}

export function PageSection({
  className,
  standalone = false,
  ...props
}: PageSectionProps): ReactElement {
  return (
    <Card
      asChild
      className={cn(
        {
          'rounded-t-none border-r-0 border-b-0 border-l-0 bg-transparent':
            standalone === false,
        },
        className
      )}
    >
      <section>
        <CardHeader>
          {props.title ? <CardTitle>{props.title}</CardTitle> : null}
          {props.description ? (
            <CardDescription>{props.description}</CardDescription>
          ) : null}
          {props.actions ? (
            <CardAction>{props.actions ? props.actions : null}</CardAction>
          ) : null}
        </CardHeader>
        {props.children ? <CardContent>{props.children}</CardContent> : null}
      </section>
    </Card>
  );
}
