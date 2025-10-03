import { cn } from '@renderer/util';
import { type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';

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
          'bg-transparent border-l-0 border-r-0 border-b-0 rounded-t-none':
            standalone === false,
        },
        className
      )}
    >
      <section>
        <CardHeader>
          {props.title && <CardTitle>{props.title}</CardTitle>}
          {props.description && (
            <CardDescription>{props.description}</CardDescription>
          )}
          {props.actions && (
            <CardAction>{props.actions && props.actions}</CardAction>
          )}
        </CardHeader>
        {props.children && <CardContent>{props.children}</CardContent>}
      </section>
    </Card>
  );
}
