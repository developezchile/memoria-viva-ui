import { Pipe, PipeTransform, inject } from '@angular/core';

import { MediaStore } from '../core/services/media';

/**
 * Convierte un mediaId en una URL mostrable.
 * Uso: `<img [src]="post.mediaId | mediaUrl | async" />`
 */
@Pipe({ name: 'mediaUrl' })
export class MediaUrlPipe implements PipeTransform {
  private readonly media = inject(MediaStore);

  transform(id: string | undefined | null): Promise<string | undefined> {
    return id ? this.media.url(id) : Promise.resolve(undefined);
  }
}
