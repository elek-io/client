import type { ReactElement } from 'react';

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

import { type Project } from '@elek-io/core';

export interface ProjectDiffProps {
  project: Project;
}

export function ProjectDiff({ project }: ProjectDiffProps): ReactElement {
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
