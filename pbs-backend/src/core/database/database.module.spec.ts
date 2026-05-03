import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(moduleRef).toBeDefined();
  });
});
