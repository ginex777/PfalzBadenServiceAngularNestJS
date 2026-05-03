import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { DataTableComponent } from './data-table.component';

describe('DataTableComponent', () => {
  let component: DataTableComponent<Record<string, unknown>>;
  let fixture: ComponentFixture<DataTableComponent<Record<string, unknown>>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', []);
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
