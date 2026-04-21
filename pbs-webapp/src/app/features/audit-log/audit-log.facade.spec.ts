import { TestBed } from '@angular/core/testing';
import { AuditLogFacade } from './audit-log.facade';

describe('AuditLogFacade', () => {
  let service: AuditLogFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditLogFacade],
    });

    service = TestBed.inject(AuditLogFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
