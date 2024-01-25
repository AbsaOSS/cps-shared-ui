import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration
} from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationSidebarComponent } from './components/navigation-sidebar/navigation-sidebar.component';
import { TitleStrategy } from '@angular/router';
import { AppPrefixTitleStrategy } from './app.prefix-title-strategy';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NavigationSidebarComponent
  ],
  providers: [
    { provide: TitleStrategy, useClass: AppPrefixTitleStrategy },
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
