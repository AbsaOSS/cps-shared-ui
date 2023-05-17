import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class AppPrefixTitleStrategy extends TitleStrategy {
  constructor (private readonly title: Title) {
    super();
  }

  override updateTitle (routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (!title) console.warn('No title defined for current route!');
    this.title.setTitle(title ? `CPS UI Kit - ${title}` : 'CPS UI Kit');
  }
}
