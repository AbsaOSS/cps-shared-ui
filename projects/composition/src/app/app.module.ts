import { NgModule, isDevMode } from '@angular/core';
import {
  BrowserModule
  // provideClientHydration
} from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationSidebarComponent } from './components/navigation-sidebar/navigation-sidebar.component';
import { TitleStrategy } from '@angular/router';
import { AppPrefixTitleStrategy } from './app.prefix-title-strategy';
import { CpsIconComponent } from 'cps-ui-kit';
import { provideA11yOverlay, A11yOverlayComponent } from 'a11y-overlay';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NavigationSidebarComponent,
    CpsIconComponent,
    A11yOverlayComponent
  ],
  providers: [
    { provide: TitleStrategy, useClass: AppPrefixTitleStrategy },
    // provideClientHydration()
    provideA11yOverlay({ enabled: isDevMode(), scanOn: 'navigation' })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
