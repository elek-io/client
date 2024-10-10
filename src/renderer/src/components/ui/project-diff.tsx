import { Project } from '@elek-io/core';
import { Chip } from './chip';
import { FormItem } from './form';
import { Input } from './input';
import { Label } from './label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Textarea } from './textarea';

export interface ProjectDiffProps {
  project: Project;
}

export function ProjectDiff({ project }: ProjectDiffProps): JSX.Element {
  return (
    <div className="text-sm p-6 bg-white flex flex-col gap-6 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
      <FormItem>
        <Label isRequired={true}>Project name</Label>
        <Input value={project.name} disabled={true} />
      </FormItem>

      <FormItem>
        <Label isRequired={false}>Project description</Label>
        <Textarea value={project.description} disabled={true} />
      </FormItem>

      <FormItem>
        <Label isRequired={true}>Supported languages</Label>
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
        <Label isRequired={true}>Default language</Label>
        <Select value={project.settings.language.default} disabled={true}>
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
    </div>
  );
}
