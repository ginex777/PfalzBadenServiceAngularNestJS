import 'reflect-metadata';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { MobileFeedbackController } from './mobile-feedback.controller';

describe('MobileFeedbackController authorization metadata', () => {
  it('does not expose mobile feedback listing to employee users', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, MobileFeedbackController.prototype.list),
    ).toEqual(['admin', 'readonly']);
  });
});
