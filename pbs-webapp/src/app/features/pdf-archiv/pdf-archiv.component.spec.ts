import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { PdfArchivComponent } from './pdf-archiv.component';

describe('PdfArchivComponent', () => {
  let component: PdfArchivComponent;
  let fixture: ComponentFixture<PdfArchivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfArchivComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfArchivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
