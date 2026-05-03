import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { PageTitleComponent } from './page-title.component';

describe('PageTitleComponent', () => {
  let component: PageTitleComponent;
  let fixture: ComponentFixture<PageTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageTitleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageTitleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Dashboard');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
