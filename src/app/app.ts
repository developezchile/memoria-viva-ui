import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { SettingsStore } from './core/services/settings';
import { BottomNav, TabId } from './layout/bottom-nav';
import { Overlays } from './layout/overlays';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNav, Overlays],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    // Aplica las preferencias de accesibilidad desde el arranque.
    inject(SettingsStore);
  }

  private readonly data = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        return r.snapshot.data as { tab?: TabId };
      }),
    ),
    { initialValue: {} as { tab?: TabId } },
  );

  protected readonly tab = computed(() => this.data().tab);
}
