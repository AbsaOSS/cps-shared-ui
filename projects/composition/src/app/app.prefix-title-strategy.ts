import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { UwtLoggerService } from '@absaoss-cps/ngx-ui-watchtower';
import './services/telemetry.schema';

@Injectable()
export class AppPrefixTitleStrategy extends TitleStrategy {
  private readonly logger = inject(UwtLoggerService).getLogger('routing');

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);

    if (!title) {
      this.logger.warn('No title defined for route', {
        context: 'TitleStrategy',
        metadata: { url: routerState.url }
      });
    }

    this.title.setTitle(title ? `CPS UI Kit - ${title}` : 'CPS UI Kit');
  }
}
