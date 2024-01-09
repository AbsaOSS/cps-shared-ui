import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabGroupPageComponent } from 'projects/composition/src/app/pages/tab-group-page/tab-group-page.component';
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
import { InfoCirclePageComponent } from './pages/info-circle-page/info-circle-page.component';
import { TooltipPageComponent } from './pages/tooltip-page/tooltip-page.component';
import { ProgressCircularPageComponent } from './pages/progress-circular-page/progress-circular-page.component';
import { PaginatorPageComponent } from './pages/paginator-page/paginator-page.component';
import { MenuPageComponent } from './pages/menu-page/menu-page.component';
import { SidebarMenuPageComponent } from './pages/sidebar-menu-page/sidebar-menu-page.component';
import { TreeTablePageComponent } from './pages/tree-table-page/tree-table-page.component';
import { DialogPageComponent } from './pages/dialog-page/dialog-page.component';
import { TimepickerPageComponent } from './pages/timepicker-page/timepicker-page.component';
import { NotificationPageComponent } from './pages/notification-page/notification-page.component';
import { FileUploadPageComponent } from './pages/file-upload-page/file-upload-page.component';

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
    path: 'sidebar-menu',
    title: 'Sidebar menu',
    component: SidebarMenuPageComponent
  },
  {
    path: 'tabs',
    title: 'Tabs',
    component: TabGroupPageComponent
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
    path: 'tree-table',
    title: 'Tree table',
    component: TreeTablePageComponent
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
    path: 'file-upload',
    title: 'File upload',
    component: FileUploadPageComponent
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
    path: 'info-circle',
    title: 'Info circle',
    component: InfoCirclePageComponent
  },
  {
    path: 'datepicker',
    title: 'Datepicker',
    component: DatepickerPageComponent
  },
  {
    path: 'dialog',
    title: 'Dialog',
    component: DialogPageComponent
  },
  {
    path: 'menu',
    title: 'Menu',
    component: MenuPageComponent
  },
  {
    path: 'notifications',
    title: 'Notifications',
    component: NotificationPageComponent
  },
  {
    path: 'paginator',
    title: 'Paginator',
    component: PaginatorPageComponent
  },
  {
    path: 'textarea',
    title: 'Textarea',
    component: TextareaPageComponent
  },
  {
    path: 'timepicker',
    title: 'Timepicker',
    component: TimepickerPageComponent
  },
  {
    path: 'tooltip',
    title: 'Tooltip directive',
    component: TooltipPageComponent
  },
  { path: '**', redirectTo: 'colors' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
