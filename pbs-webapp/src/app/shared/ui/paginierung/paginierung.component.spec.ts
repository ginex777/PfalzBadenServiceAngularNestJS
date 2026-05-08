import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { PaginierungComponent } from './paginierung.component';

describe('PaginierungComponent', () => {
  let fixture: ComponentFixture<PaginierungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginierungComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginierungComponent);
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('pageSize', 25);
    fixture.componentRef.setInput('total', 70);
    fixture.detectChanges();
  });

  it('emits bounded previous and next page changes', () => {
    const component = fixture.componentInstance;
    const pageChanges: number[] = [];
    component.pageChange.subscribe((page) => pageChanges.push(page));

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();

    expect(pageChanges).toEqual([1, 3]);
  });

  it('emits selected page size', () => {
    const component = fixture.componentInstance;
    const pageSizes: number[] = [];
    component.pageSizeChange.subscribe((pageSize) => pageSizes.push(pageSize));

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(pageSizes).toEqual([50]);
  });

  it('can hide the page-size selector for fixed-size feature lists', () => {
    fixture.componentRef.setInput('showPageSize', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Seite 2 / 3');
  });
});
