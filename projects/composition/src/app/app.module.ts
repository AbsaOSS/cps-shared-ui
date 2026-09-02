import { NgModule } from '@angular/core';
import {
  BrowserModule
  // provideClientHydration
} from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { CpsIconComponent } from 'cps-ui-kit';
import {
  CPS_LOG_API_PROVIDER,
  CPS_RUM_CREDENTIALS_PROVIDER,
  provideCpsTelemetry,
  provideCpsTelemetrySink
} from 'cps-telemetry';
import packageJson from '../../../cps-ui-kit/package.json';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppPrefixTitleStrategy } from './app.prefix-title-strategy';
import { NavigationSidebarComponent } from './components/navigation-sidebar/navigation-sidebar.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { AppLogApiProvider } from './services/app-log-api.provider';
import { AppRumCredentialsProvider } from './services/rum-credentials.provider';
import './services/telemetry.schema';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NavigationSidebarComponent,
    CpsIconComponent,
    ThemeToggleComponent
  ],
  providers: [
    { provide: TitleStrategy, useClass: AppPrefixTitleStrategy },
    provideCpsTelemetry({
      application: 'composition',
      environment: 'production',
      version: packageJson.version
    }),
    provideCpsTelemetrySink('rum'),
    {
      provide: CPS_RUM_CREDENTIALS_PROVIDER,
      useExisting: AppRumCredentialsProvider
    },
    { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider }
    // provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
