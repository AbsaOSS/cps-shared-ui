import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InputPageComponent } from './pages/input-page/input-page.component';
import { SelectPageComponent } from './pages/select-page/select-page.component';
import { IconsPageComponent } from './pages/icons-page/icons-page/icons-page.component';
import { ColorsPageComponent } from './pages/colors-page/colors-page/colors-page.component';
import { CheckboxPageComponent } from './pages/checkbox-page/checkbox-page.component';
import { RadioPageComponent } from './pages/radio-page/radio-page.component';
import { ButtonPageComponent } from './pages/button-page/button-page.component';
import { TagPageComponent } from './pages/tag-page/tag-page.component';
import { ChipPageComponent } from './pages/chip-page/chip-page.component';
import { AutocompletePageComponent } from './pages/autocomplete-page/autocomplete-page.component';
import { ProgressLinearPageComponent } from './pages/progress-linear-page/progress-linear-page.component';
import { DatepickerPageComponent } from './pages/datepicker-page/datepicker-page.component';
import { ButtonTogglePageComponent } from './pages/button-toggle-page/button-toggle-page.component';

const routes: Routes = [
  {
    path: 'colors',
    title: 'Color pack',
    component: ColorsPageComponent
  },
  {
    path: 'icon',
    title: 'Icon',
    component: IconsPageComponent
  },
  {
    path: 'input',
    title: 'Input',
    component: InputPageComponent
  },
  {
    path: 'select',
    title: 'Select',
    component: SelectPageComponent
  },
  {
    path: 'autocomplete',
    title: 'Autocomplete',
    component: AutocompletePageComponent
  },
  {
    path: 'button',
    title: 'Button',
    component: ButtonPageComponent
  },
  {
    path: 'checkbox',
    title: 'Checkbox',
    component: CheckboxPageComponent
  },
  {
    path: 'radio',
    title: 'Radio',
    component: RadioPageComponent
  },
  {
    path: 'tag',
    title: 'Tag',
    component: TagPageComponent
  },
  {
    path: 'chip',
    title: 'Chip',
    component: ChipPageComponent
  },
  {
    path: 'progress-linear',
    title: 'Progress linear',
    component: ProgressLinearPageComponent
  },
  {
    path: 'datepicker',
    title: 'Datepicker',
    component: DatepickerPageComponent
  },
  {
    path: 'button-toggles',
    title: 'Button toggles',
    component: ButtonTogglePageComponent
  },
  { path: '**', redirectTo: 'colors' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
