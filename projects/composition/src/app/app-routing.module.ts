import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'colors',
    title: 'Color pack',
    loadComponent: () =>
      import('./pages/colors-page/colors-page/colors-page.component').then(
        (mod) => mod.ColorsPageComponent
      )
  },
  {
    path: 'icon',
    title: 'Icon',
    loadComponent: () =>
      import('./pages/icons-page/icons-page/icons-page.component').then(
        (mod) => mod.IconsPageComponent
      )
  },
  {
    path: 'input',
    title: 'Input',
    loadComponent: () =>
      import('./pages/input-page/input-page.component').then(
        (mod) => mod.InputPageComponent
      )
  },
  {
    path: 'select',
    title: 'Select',
    loadComponent: () =>
      import('./pages/select-page/select-page.component').then(
        (mod) => mod.SelectPageComponent
      )
  },
  {
    path: 'sidebar-menu',
    title: 'Sidebar menu',
    loadComponent: () =>
      import('./pages/sidebar-menu-page/sidebar-menu-page.component').then(
        (mod) => mod.SidebarMenuPageComponent
      )
  },
  {
    path: 'tabs',
    title: 'Tabs',
    loadComponent: () =>
      import('./pages/tab-group-page/tab-group-page.component').then(
        (mod) => mod.TabGroupPageComponent
      )
  },
  {
    path: 'tree-select',
    title: 'Tree select',
    loadComponent: () =>
      import('./pages/tree-select-page/tree-select-page.component').then(
        (mod) => mod.TreeSelectPageComponent
      )
  },
  {
    path: 'autocomplete',
    title: 'Autocomplete',
    loadComponent: () =>
      import('./pages/autocomplete-page/autocomplete-page.component').then(
        (mod) => mod.AutocompletePageComponent
      )
  },
  {
    path: 'tree-autocomplete',
    title: 'Tree autocomplete',
    loadComponent: () =>
      import(
        './pages/tree-autocomplete-page/tree-autocomplete-page.component'
      ).then((mod) => mod.TreeAutocompletePageComponent)
  },
  {
    path: 'button',
    title: 'Button',
    loadComponent: () =>
      import('./pages/button-page/button-page.component').then(
        (mod) => mod.ButtonPageComponent
      )
  },
  {
    path: 'button-toggles',
    title: 'Button toggles',
    loadComponent: () =>
      import('./pages/button-toggle-page/button-toggle-page.component').then(
        (mod) => mod.ButtonTogglePageComponent
      )
  },
  {
    path: 'checkbox',
    title: 'Checkbox',
    loadComponent: () =>
      import('./pages/checkbox-page/checkbox-page.component').then(
        (mod) => mod.CheckboxPageComponent
      )
  },
  {
    path: 'radio',
    title: 'Radio',
    loadComponent: () =>
      import('./pages/radio-page/radio-page.component').then(
        (mod) => mod.RadioPageComponent
      )
  },
  {
    path: 'table',
    title: 'Table',
    loadComponent: () =>
      import('./pages/table-page/table-page.component').then(
        (mod) => mod.TablePageComponent
      )
  },
  {
    path: 'tree-table',
    title: 'Tree table',
    loadComponent: () =>
      import('./pages/tree-table-page/tree-table-page.component').then(
        (mod) => mod.TreeTablePageComponent
      )
  },
  {
    path: 'tag',
    title: 'Tag',
    loadComponent: () =>
      import('./pages/tag-page/tag-page.component').then(
        (mod) => mod.TagPageComponent
      )
  },
  {
    path: 'chip',
    title: 'Chip',
    loadComponent: () =>
      import('./pages/chip-page/chip-page.component').then(
        (mod) => mod.ChipPageComponent
      )
  },
  {
    path: 'loader',
    title: 'Loader',
    loadComponent: () =>
      import('./pages/loader-page/loader-page.component').then(
        (mod) => mod.LoaderPageComponent
      )
  },
  {
    path: 'expansion-panel',
    title: 'Expansion panel',
    loadComponent: () =>
      import(
        './pages/expansion-panel-page/expansion-panel-page.component'
      ).then((mod) => mod.ExpansionPanelPageComponent)
  },
  {
    path: 'file-upload',
    title: 'File upload',
    loadComponent: () =>
      import('./pages/file-upload-page/file-upload-page.component').then(
        (mod) => mod.FileUploadPageComponent
      )
  },
  {
    path: 'progress-circular',
    title: 'Progress circular',
    loadComponent: () =>
      import(
        './pages/progress-circular-page/progress-circular-page.component'
      ).then((mod) => mod.ProgressCircularPageComponent)
  },
  {
    path: 'progress-linear',
    title: 'Progress linear',
    loadComponent: () =>
      import(
        './pages/progress-linear-page/progress-linear-page.component'
      ).then((mod) => mod.ProgressLinearPageComponent)
  },
  {
    path: 'info-circle',
    title: 'Info circle',
    loadComponent: () =>
      import('./pages/info-circle-page/info-circle-page.component').then(
        (mod) => mod.InfoCirclePageComponent
      )
  },
  {
    path: 'datepicker',
    title: 'Datepicker',
    loadComponent: () =>
      import('./pages/datepicker-page/datepicker-page.component').then(
        (mod) => mod.DatepickerPageComponent
      )
  },
  {
    path: 'dialog',
    title: 'Dialog',
    loadComponent: () =>
      import('./pages/dialog-page/dialog-page.component').then(
        (mod) => mod.DialogPageComponent
      )
  },
  {
    path: 'menu',
    title: 'Menu',
    loadComponent: () =>
      import('./pages/menu-page/menu-page.component').then(
        (mod) => mod.MenuPageComponent
      )
  },
  {
    path: 'notifications',
    title: 'Notifications',
    loadComponent: () =>
      import('./pages/notification-page/notification-page.component').then(
        (mod) => mod.NotificationPageComponent
      )
  },
  {
    path: 'paginator',
    title: 'Paginator',
    loadComponent: () =>
      import('./pages/paginator-page/paginator-page.component').then(
        (mod) => mod.PaginatorPageComponent
      )
  },
  {
    path: 'textarea',
    title: 'Textarea',
    loadComponent: () =>
      import('./pages/textarea-page/textarea-page.component').then(
        (mod) => mod.TextareaPageComponent
      )
  },
  {
    path: 'timepicker',
    title: 'Timepicker',
    loadComponent: () =>
      import('./pages/timepicker-page/timepicker-page.component').then(
        (mod) => mod.TimepickerPageComponent
      )
  },
  {
    path: 'tooltip',
    title: 'Tooltip directive',
    loadComponent: () =>
      import('./pages/tooltip-page/tooltip-page.component').then(
        (mod) => mod.TooltipPageComponent
      )
  },
  { path: '**', redirectTo: 'colors' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
