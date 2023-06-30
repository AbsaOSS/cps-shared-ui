import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InputPageComponent } from './pages/input-page/input-page.component';
import { SelectPageComponent } from './pages/select-page/select-page.component';
import { IconsPageComponent } from './pages/icons-page/icons-page/icons-page.component';
import { ColorsPageComponent } from './pages/colors-page/colors-page/colors-page.component';
import { CheckboxPageComponent } from './pages/checkbox-page/checkbox-page.component';
import { RadioPageComponent } from './pages/radio-page/radio-page.component';
import { ButtonPageComponent } from './pages/button-page/button-page.component';
import { TablePageComponent } from './pages/table-page/table-page.component';
import { TagPageComponent } from './pages/tag-page/tag-page.component';
import { ChipPageComponent } from './pages/chip-page/chip-page.component';
import { AutocompletePageComponent } from './pages/autocomplete-page/autocomplete-page.component';
import { ProgressLinearPageComponent } from './pages/progress-linear-page/progress-linear-page.component';
import { DatepickerPageComponent } from './pages/datepicker-page/datepicker-page.component';
import { LoaderPageComponent } from './pages/loader-page/loader-page.component';
import { ExpansionPanelPageComponent } from './pages/expansion-panel-page/expansion-panel-page.component';
import { TreeAutocompletePageComponent } from './pages/tree-autocomplete-page/tree-autocomplete-page.component';
import { TreeSelectPageComponent } from './pages/tree-select-page/tree-select-page.component';
import { TextareaPageComponent } from './pages/textarea-page/textarea-page.component';
import { ButtonTogglePageComponent } from './pages/button-toggle-page/button-toggle-page.component';
import { ProgressCircularPageComponent } from './pages/progress-circular-page/progress-circular-page.component';

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
    path: 'tree-select',
    title: 'Tree select',
    component: TreeSelectPageComponent
  },
  {
    path: 'autocomplete',
    title: 'Autocomplete',
    component: AutocompletePageComponent
  },
  {
    path: 'tree-autocomplete',
    title: 'Tree autocomplete',
    component: TreeAutocompletePageComponent
  },
  {
    path: 'button',
    title: 'Button',
    component: ButtonPageComponent
  },
  {
    path: 'button-toggles',
    title: 'Button toggles',
    component: ButtonTogglePageComponent
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
    path: 'table',
    title: 'Table',
    component: TablePageComponent
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
    path: 'loader',
    title: 'Loader',
    component: LoaderPageComponent
  },
  {
    path: 'expansion-panel',
    title: 'Expansion panel',
    component: ExpansionPanelPageComponent
  },
  {
    path: 'progress-circular',
    title: 'Progress circular',
    component: ProgressCircularPageComponent
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
    path: 'textarea',
    title: 'Textarea',
    component: TextareaPageComponent
  },
  { path: '**', redirectTo: 'colors' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
