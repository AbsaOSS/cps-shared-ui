import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InputPageComponent } from './pages/input-page/input-page.component';
import { IconsPageComponent } from './pages/icons-page/icons-page/icons-page.component';
import { ColorsPageComponent } from './pages/colors-page/colors-page/colors-page.component';
import { CheckboxPageComponent } from './pages/checkbox-page/checkbox-page.component';
import { RadioPageComponent } from './pages/radio-page/radio-page.component';
import { ButtonPageComponent } from './pages/button-page/button-page.component';

const routes: Routes = [
  {
    path: 'colors',
    title: 'Color pack',
    component: ColorsPageComponent,
  },
  {
    path: 'icon',
    title: 'Icon',
    component: IconsPageComponent,
  },
  {
    path: 'input',
    title: 'Input',
    component: InputPageComponent,
  },
  {
    path: 'button',
    title: 'Button',
    component: ButtonPageComponent,
  },
  {
    path: 'checkbox',
    title: 'Checkbox',
    component: CheckboxPageComponent,
  },
  {
    path: 'radio',
    title: 'Radio',
    component: RadioPageComponent,
  },
  { path: '**', redirectTo: 'colors' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
