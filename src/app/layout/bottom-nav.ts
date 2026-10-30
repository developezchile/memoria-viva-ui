import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon, IconName } from '../shared/icon';

export type TabId = 'perfil' | 'duelo' | 'familia' | 'calendario' | 'bienestar';

interface NavItem {
  id: TabId;
  label: string;
  url: string;
  icon: IconName;
}

const ITEMS: NavItem[] = [
  { id: 'perfil', label: 'Mi Perfil', url: '/perfil', icon: 'user' },
  { id: 'duelo', label: 'Mi Duelo', url: '/duelo', icon: 'heart' },
  { id: 'familia', label: 'Mi Familia', url: '/familia', icon: 'people' },
  { id: 'calendario', label: 'Calendario', url: '/calendario', icon: 'calendar' },
  { id: 'bienestar', label: 'Bienestar', url: '/bienestar', icon: 'hands' },
];

@Component({
  selector: 'mv-bottom-nav',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    nav {
      position: absolute;
      left: 0; right: 0; bottom: 0;
      z-index: 10;
      height: var(--nav-h);
      display: flex;
      align-items: center;
      background: var(--crema);
      border-top: 1px solid var(--borde);
      box-shadow: 0 -2px 8px rgba(107, 79, 58, 0.05);
      padding-bottom: env(safe-area-inset-bottom);
    }
    a {
      flex: 1;
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 8px 0;
      font-size: 10px; color: var(--texto-sec); text-decoration: none;
    }
    a.active { color: var(--verde); font-weight: 600; }
    /* Mi Familia es el inicio: ícono destacado al centro */
    .home .bubble {
      display: flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; margin-top: -22px; border-radius: 50%;
      background: var(--crema); border: 1px solid var(--borde);
      box-shadow: 0 -2px 8px rgba(107, 79, 58, 0.08);
    }
    .home.active .bubble { background: var(--verde); border-color: var(--verde); }
  `,
  template: `
    <nav aria-label="Navegación principal">
      @for (item of items; track item.id) {
        @let isActive = active() === item.id;
        @let isHome = item.id === 'familia';
        <a
          [routerLink]="item.url"
          [class.active]="isActive"
          [class.home]="isHome"
          [attr.aria-current]="isActive ? 'page' : null"
        >
          @if (isHome) {
            <span class="bubble"><mv-icon [name]="item.icon" [color]="isActive ? '#FFFFFF' : '#A89070'" /></span>
          } @else {
            <mv-icon [name]="item.icon" [color]="isActive ? '#737B4C' : '#A89070'" />
          }
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
})
export class BottomNav {
  protected readonly items = ITEMS;
  readonly active = input<TabId | undefined>(undefined);
}
