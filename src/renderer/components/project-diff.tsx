import { useEffect, useState } from 'react';

import { DiffContainer } from '@renderer/components/diff-container';
import { Chip } from '@renderer/components/ui/chip';
import { FormItem } from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { Textarea } from '@renderer/components/ui/textarea';

import { type GitCommit, type Project } from '@elek-io/core';

import { useQueryNoError } from '../hooks/useQueryNoError';
import { queryOptions } from '../queries';

function ProjectDiffForm({ project }: { project: Project }): React.JSX.Element {
  return (
    <>
      <FormItem>
        <Label isRequired>Project name</Label>
        <Input value={project.name} disabled />
      </FormItem>

      <FormItem>
        <Label isRequired={false}>Project description</Label>
        <Textarea value={project.description} disabled />
      </FormItem>

      <FormItem>
        <Label isRequired>Supported languages</Label>
        <ul className="flex flex-wrap">
          {project.settings.language.supported.map((language) => {
            return (
              <li key={language} className="mr-2 mb-2">
                <Chip>{language}</Chip>
              </li>
            );
          })}
        </ul>
      </FormItem>

      <FormItem>
        <Label isRequired>Default language</Label>
        <Select value={project.settings.language.default} disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              key={project.settings.language.default}
              value={project.settings.language.default}
            >
              {project.settings.language.default}
            </SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
    </>
  );
}

export function ProjectDiff({
  project,
  commit,
}: {
  project: Project;
  commit: GitCommit;
}): React.JSX.Element | undefined {
  const [commitBefore, setCommitBefore] = useState<GitCommit | undefined>(
    undefined
  );
  const [commitAfter, setCommitAfter] = useState<GitCommit | undefined>(
    undefined
  );
  const { data: projectBefore } = useQueryNoError({
    ...queryOptions.projects.read({
      id: project.id,
      commitHash: commitBefore?.hash,
    }),
    enabled: commitBefore !== undefined,
  });
  const { data: projectAfter } = useQueryNoError({
    ...queryOptions.projects.read({
      id: project.id,
      commitHash: commitAfter?.hash,
    }),
    enabled: commitAfter !== undefined,
  });

  useEffect(() => {
    if (
      commit.message.method === 'update' ||
      commit.message.method === 'delete'
    ) {
      const projectCommitHistory = project.fullHistory.filter(
        (commitFromHistory) =>
          commitFromHistory.message.reference.objectType === 'project' &&
          commitFromHistory.message.reference.id === commit.message.reference.id
      );
      const currentCommitIndex = projectCommitHistory.findIndex(
        (commitFromHistory) => commitFromHistory.hash === commit.hash
      );
      const commitBefore = projectCommitHistory.at(currentCommitIndex + 1);
      if (!commitBefore) {
        throw new Error(
          `Tried to get commit of Project before "${commit.message.method}" but none was found`
        );
      }

      setCommitBefore(commitBefore);
    }

    if (commit.message.method !== 'delete') {
      setCommitAfter(commit);
    }
  }, [commit, project.fullHistory]);

  if ((!commitBefore || !projectBefore) && commitAfter && projectAfter) {
    return (
      <DiffContainer type="create" commit={commitAfter}>
        <ProjectDiffForm project={projectAfter} />
      </DiffContainer>
    );
  }

  if ((!commitAfter || !projectAfter) && commitBefore && projectBefore) {
    return (
      <DiffContainer type="delete" commit={commitBefore}>
        <ProjectDiffForm project={projectBefore} />
      </DiffContainer>
    );
  }

  if (commitBefore && commitAfter && projectBefore && projectAfter) {
    return (
      <>
        <DiffContainer type="before" commit={commitBefore}>
          <ProjectDiffForm project={projectBefore} />
        </DiffContainer>

        <DiffContainer type="after" commit={commitAfter}>
          <ProjectDiffForm project={projectAfter} />
        </DiffContainer>
      </>
    );
  }

  return undefined;
}
