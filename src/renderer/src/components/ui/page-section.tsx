import { cn } from '@renderer/util';
import { type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import {
  Card,
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
}

export function PageSection({
  className,
  ...props
}: PageSectionProps): ReactElement {
  return (
    <section className={cn('', className)}>
      <Card>
        <CardHeader>
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <CardTitle>{props.title}</CardTitle>
              <CardDescription>{props.description}</CardDescription>
            </div>
            <div className="sm:ml-16 sm:flex-none">
              {props.actions && props.actions}
            </div>
          </div>
        </CardHeader>
        <CardContent>{props.children}</CardContent>
      </Card>
    </section>
  );
}
