import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { NachweiseService } from '../nachweise/nachweise.service';
import { ToastService } from '../../core/services/toast.service';
import { Objekt } from '../../core/models';

@Component({
  selector: 'app-foto-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageTitleComponent],
  templateUrl: './foto-upload.component.html',
  styleUrl: './foto-upload.component.scss',
})
export class FotoUploadComponent implements OnInit {
  private readonly service = inject(NachweiseService);
  private readonly toast = inject(ToastService);

  protected readonly objects = signal<Objekt[]>([]);
  protected readonly objectsLoading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly uploadSuccess = signal(false);

  protected selectedObjectId = signal<number | null>(null);
  protected note = signal('');
  protected selectedFile = signal<File | null>(null);
  protected fileError = signal<string | null>(null);

  ngOnInit(): void {
    this.objectsLoading.set(true);
    this.service.loadObjectsAll().subscribe({
      next: (rows) => {
        this.objects.set(rows);
        if (rows.length > 0) this.selectedObjectId.set(rows[0]!.id);
        this.objectsLoading.set(false);
      },
      error: () => this.objectsLoading.set(false),
    });
  }

  protected onObjectChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    const n = Number(v);
    this.selectedObjectId.set(Number.isFinite(n) && n > 0 ? n : null);
  }

  protected onNoteChange(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }

  protected onFileChange(event: Event): void {
    this.fileError.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && !file.type.startsWith('image/')) {
      this.fileError.set('Nur Bilddateien erlaubt.');
      this.selectedFile.set(null);
      return;
    }
    this.selectedFile.set(file);
  }

  protected get canSubmit(): boolean {
    return (
      this.selectedObjectId() !== null &&
      this.selectedFile() !== null &&
      !this.uploading()
    );
  }

  protected submit(): void {
    const objectId = this.selectedObjectId();
    const file = this.selectedFile();
    if (!objectId || !file) return;

    this.uploading.set(true);
    this.service.uploadEvidence(objectId, file, this.note() || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.uploadSuccess.set(true);
        this.selectedFile.set(null);
        this.note.set('');
        this.toast.success('Nachweis hochgeladen.');
      },
      error: (e: { error?: { message?: string } }) => {
        this.uploading.set(false);
        this.toast.error(e?.error?.message ?? 'Upload fehlgeschlagen.');
      },
    });
  }

  protected resetSuccess(): void {
    this.uploadSuccess.set(false);
  }
}
