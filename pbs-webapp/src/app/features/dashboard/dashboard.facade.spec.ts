import { TestBed } from '@angular/core/testing';
import { DashboardFacade } from './dashboard.facade';

describe('DashboardFacade', () => {
  let service: DashboardFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardFacade]
    });

    service = TestBed.inject(DashboardFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
