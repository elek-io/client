'use client';

import {
  GitCommit,
  gitCommitIconSchema,
  SupportedLanguage,
} from '@elek-io/core';
import { cn, formatDatetime, parseGitCommitMessage } from '@renderer/util';
import { Minus, PartyPopper, Plus, Wrench } from 'lucide-react';
import { HTMLAttributes } from 'react';

export interface CommitProps extends HTMLAttributes<HTMLDivElement>, GitCommit {
  language: SupportedLanguage;
}

export function Commit({ className, ...props }: CommitProps): JSX.Element {
  const { icon, method, objectType } = parseGitCommitMessage(props.message);
  const iconComponent =
    icon === gitCommitIconSchema.enum.INIT ? (
      <PartyPopper className="w-6 h-6" />
    ) : icon === gitCommitIconSchema.enum.CREATE ? (
      <Plus className="w-6 h-6" />
    ) : icon === gitCommitIconSchema.enum.UPDATE ? (
      <Wrench className="w-6 h-6" />
    ) : icon === gitCommitIconSchema.enum.DELETE ? (
      <Minus className="w-6 h-6" />
    ) : null;

  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {iconComponent}
      <div>
        <div className="flex items-center text-sm">
          {method} {objectType}
        </div>
        <div className="text-xs font-medium text-zinc-400">
          {props.author.name} -{' '}
          {formatDatetime(props.datetime, props.language).relative}
        </div>
      </div>
    </div>
  );
}
