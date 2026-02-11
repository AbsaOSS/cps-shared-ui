import { NgModule } from '@angular/core';
import {
  BrowserModule
  // provideClientHydration
} from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { CpsIconComponent } from 'cps-ui-kit';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppPrefixTitleStrategy } from './app.prefix-title-strategy';
import { NavigationSidebarComponent } from './components/navigation-sidebar/navigation-sidebar.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NavigationSidebarComponent,
    ThemeToggleComponent,
    CpsIconComponent
  ],
  providers: [
    { provide: TitleStrategy, useClass: AppPrefixTitleStrategy }
    // provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
