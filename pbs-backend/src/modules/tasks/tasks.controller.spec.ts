import 'reflect-metadata';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { TasksController } from './tasks.controller';

describe('TasksController authorization metadata', () => {
  it('keeps task updates admin-only even though readonly can list tasks', () => {
    expect(Reflect.getMetadata(ROLES_KEY, TasksController)).toEqual([
      'admin',
      'readonly',
    ]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TasksController.prototype.update),
    ).toEqual(['admin']);
    expect(
      Reflect.getMetadata(ROLES_KEY, TasksController.prototype.create),
    ).toEqual(['admin']);
  });
});
