import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Ui } from '../../../core/services/ui';
import { WellnessStore } from '../../../core/services/wellness';
import { EmptyState } from '../../../shared/empty-state';
import { Header } from '../../../shared/header';
import { Icon } from '../../../shared/icon';
import { SpecialistPhoto } from '../specialist-photo';

/** Detalle del especialista: bio, horarios disponibles y solicitud de contacto. */
@Component({
  selector: 'mv-specialist-detail',
  imports: [RouterLink, Header, Icon, EmptyState, SpecialistPhoto],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'screen' },
  styles: `
    .screen-body { padding: 16px 16px calc(var(--nav-h) + 24px); }
    .hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; border-radius: 16px; padding: 24px 16px; }
    .hero mv-specialist-photo { margin-bottom: 8px; }
    h2 { font-family: var(--font-titulo); font-size: 1.375rem; color: var(--madera); }
    .title { font-size: 0.875rem; color: var(--casa); }
    .meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; margin-top: 8px; font-size: 0.8125rem; color: var(--texto-sec); }
    .meta span { display: inline-flex; align-items: center; gap: 4px; }
    .rating { color: var(--madera); font-weight: 600; }
    .block { margin-top: 24px; }
    .bio { font-size: 0.9375rem; line-height: 1.6; color: var(--madera); }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .tag { background: var(--crema); color: var(--casa); font-size: 0.75rem; padding: 6px 12px; }
    .slots { display: flex; flex-wrap: wrap; gap: 8px; }
    .slot {
      min-height: 44px; padding: 0 16px; border-radius: 22px; cursor: pointer;
      border: 1.5px solid var(--borde); background: #fff; color: var(--madera);
      font-family: var(--font-cuerpo); font-size: 0.875rem;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .slot.on { background: var(--verde); border-color: var(--verde); color: #fff; font-weight: 600; }
    .slot-hint { margin-top: 8px; font-size: 0.75rem; color: var(--texto-sec); }
    .contact { padding: 0; overflow: hidden; border-radius: 16px; }
    .contact a { text-decoration: none; }
    .contact small { display: block; font-size: 0.75rem; color: var(--texto-sec); }
    .actions { margin-top: 24px; }
    .privacy { margin-top: 10px; font-size: 0.75rem; line-height: 1.5; text-align: center; color: var(--texto-sec); }
    a.btn-primary { text-decoration: none; }
  `,
  template: `
    @let s = specialist();
    <mv-header [title]="s ? 'Especialista' : 'No encontrado'" back="/bienestar/especialistas" />
    <div class="screen-body with-nav">
      @if (s) {
        <section class="card hero">
          <mv-specialist-photo [specialist]="s" [size]="104" />
          <h2>{{ s.name }}</h2>
          <p class="title">{{ s.title }}</p>
          <p class="meta">
            <span class="rating"><mv-icon name="star" [size]="14" color="#D4A843" [filled]="true" /> {{ s.rating.toFixed(1) }}</span>
            <span><mv-icon name="map-pin" [size]="14" color="#A89070" /> {{ s.city }}</span>
            <span>{{ s.modality.join(' · ') }}</span>
          </p>
        </section>

        <section class="block" aria-labelledby="bio-title">
          <h3 id="bio-title" class="section-title">Sobre su trabajo</h3>
          <p class="bio">{{ s.bio }}</p>
          <div class="tags">
            @for (sp of s.specialties; track sp) {
              <span class="chip tag">{{ sp }}</span>
            }
            @if (s.petGrief) {
              <span class="chip tag">🐾 Acompaña el duelo por mascotas</span>
            }
          </div>
        </section>

        <section class="block" aria-labelledby="slots-title">
          <h3 id="slots-title" class="section-title">Horarios disponibles</h3>
          <div class="slots" role="radiogroup" aria-labelledby="slots-title">
            @for (sl of s.slots; track sl) {
              @let on = slot() === sl;
              <button type="button" role="radio" class="slot" [class.on]="on" [attr.aria-checked]="on" (click)="pick(sl)">
                <mv-icon name="clock" [size]="14" [color]="on ? '#FFFFFF' : '#A89070'" /> {{ sl }}
              </button>
            }
          </div>
          @if (slotError()) {
            <p class="error-text" role="alert">{{ slotError() }}</p>
          } @else {
            <p class="slot-hint">Elige el horario que te acomode para una primera conversación.</p>
          }
        </section>

        <section class="block">
          <label class="field-label" for="msg">Mensaje (opcional)</label>
          <textarea id="msg" class="textarea" maxlength="500" placeholder="Cuéntale brevemente qué te gustaría conversar…"
            [value]="message()" (input)="message.set($any($event.target).value)"></textarea>
        </section>

        <section class="block" aria-labelledby="contact-title">
          <h3 id="contact-title" class="section-title">Contacto directo</h3>
          <div class="card contact">
            <a class="list-row" [href]="'mailto:' + s.email">
              <mv-icon name="mail" [size]="20" color="#737B4C" />
              <span><small>Correo</small>{{ s.email }}</span>
            </a>
            <a class="list-row" [href]="telHref(s.phone)">
              <mv-icon name="phone" [size]="20" color="#737B4C" />
              <span><small>Teléfono</small>{{ s.phone }}</span>
            </a>
          </div>
        </section>

        <div class="actions">
          <button type="button" class="btn-primary" (click)="contact()">Contactar</button>
          <p class="privacy">Solo compartiremos tu nombre y tu mensaje con este profesional.</p>
        </div>
      } @else {
        <mv-empty-state emoji="🍂" title="No encontramos a este especialista" message="Puede que ya no esté disponible en el directorio.">
          <a class="btn-primary" routerLink="/bienestar/especialistas">Ver especialistas</a>
        </mv-empty-state>
      }
    </div>
  `,
})
export class SpecialistDetail {
  private readonly store = inject(WellnessStore);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly specialist = computed(() => this.store.specialist(this.id()));
  protected readonly slot = signal<string | null>(null);
  protected readonly message = signal('');
  protected readonly tried = signal(false);
  protected readonly slotError = computed(() => (this.tried() && !this.slot() ? 'Elige un horario para continuar.' : ''));

  protected telHref(phone: string): string {
    return 'tel:' + phone.replace(/\s/g, '');
  }

  protected pick(slot: string): void {
    this.slot.set(slot);
  }

  protected async contact(): Promise<void> {
    this.tried.set(true);
    const s = this.specialist();
    const slot = this.slot();
    if (!s || !slot) return;
    await this.ui.withLoading('Enviando tu solicitud…', async () => {
      this.store.requestContact(s.id, slot, this.message());
      await new Promise(r => setTimeout(r, 600));
    });
    this.router.navigate(['/bienestar/solicitud-enviada'], { queryParams: { especialista: s.id, horario: slot } });
  }
}
