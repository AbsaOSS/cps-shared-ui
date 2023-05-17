import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavigationSidebarComponent } from './components/navigation-sidebar/navigation-sidebar.component';
import { TitleStrategy } from '@angular/router';
import { AppPrefixTitleStrategy } from './app.prefix-title-strategy';
import { CpsIconComponent } from 'cps-ui-kit';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NavigationSidebarComponent,
    CpsIconComponent
  ],
  providers: [{ provide: TitleStrategy, useClass: AppPrefixTitleStrategy }],
  bootstrap: [AppComponent]
})
export class AppModule {}
