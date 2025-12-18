import { faker } from '@faker-js/faker';

import { test } from '../../fixtures/electronApp';
import { CrudHelper } from '../../helpers/crud';

test.describe('Project CRUD Operations', () => {
  let crud: CrudHelper;

  test.beforeEach(async ({ mainWindow }) => {
    crud = new CrudHelper(mainWindow);
  });

  test('should create a new basic Project', async () => {
    await crud.createProject({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      settings: {
        language: {
          supported: ['en'],
          default: 'en',
        },
      },
    });
  });

  test('should create a new Project with additional languages', async () => {
    await crud.createProject({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      settings: {
        language: {
          supported: ['de', 'fr', 'es'],
          default: 'de',
        },
      },
    });
  });
});
