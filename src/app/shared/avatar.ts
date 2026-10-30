import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Avatar circular con iniciales o imagen. `golden` marca al ser querido. */
@Component({
  selector: 'mv-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 2px solid var(--borde);
    }
    .avatar.golden { border: 2.5px solid var(--dorado); }
    img { width: 100%; height: 100%; object-fit: cover; }
    span { font-family: var(--font-cuerpo); font-weight: 600; user-select: none; }
    .golden span { font-family: var(--font-titulo); color: var(--casa) !important; }
  `,
  template: `
    <div
      class="avatar"
      [class.golden]="golden()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background]="bg()"
    >
      @if (src()) {
        <img [src]="src()" alt="" />
      } @else {
        <span [style.font-size.px]="size() * 0.35" [style.color]="textColor()">{{ initials() }}</span>
      }
    </div>
  `,
})
export class Avatar {
  readonly initials = input('');
  readonly size = input(40);
  readonly golden = input(false);
  readonly bg = input('#EBDFC6');
  readonly textColor = input('#4A3B2A');
  readonly src = input<string | undefined>(undefined);
}
