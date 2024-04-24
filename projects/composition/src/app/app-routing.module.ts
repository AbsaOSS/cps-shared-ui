import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlMatcher, UrlSegment } from '@angular/router';

const pathMatcher: (path: string) => UrlMatcher = (path: string) => (url) => {
  if (url.length === 1) {
    if (url[0].path === path) {
      return { consumed: url };
    }
  }

  if (url.length === 2) {
    if (
      url[0].path === path &&
      (url[1].path === 'api' || url[1].path === 'examples')
    ) {
      return {
        consumed: url,
        posParams: { type: new UrlSegment(url[1].path, {}) }
      };
    }
  }

  return null;
};

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
    matcher: pathMatcher('icon'),
    title: 'Icon',
    loadComponent: () =>
      import('./pages/icons-page/icons-page/icons-page.component').then(
        (mod) => mod.IconsPageComponent
      )
  },
  {
    matcher: pathMatcher('input'),
    title: 'Input',
    loadComponent: () =>
      import('./pages/input-page/input-page.component').then(
        (mod) => mod.InputPageComponent
      )
  },
  {
    matcher: pathMatcher('select'),
    title: 'Select',
    loadComponent: () =>
      import('./pages/select-page/select-page.component').then(
        (mod) => mod.SelectPageComponent
      )
  },
  {
    matcher: pathMatcher('sidebar-menu'),
    title: 'Sidebar menu',
    loadComponent: () =>
      import('./pages/sidebar-menu-page/sidebar-menu-page.component').then(
        (mod) => mod.SidebarMenuPageComponent
      )
  },
  {
    matcher: pathMatcher('tab-group'),
    title: 'Tabs',
    loadComponent: () =>
      import('./pages/tab-group-page/tab-group-page.component').then(
        (mod) => mod.TabGroupPageComponent
      )
  },
  {
    matcher: pathMatcher('tree-select'),
    title: 'Tree select',
    loadComponent: () =>
      import('./pages/tree-select-page/tree-select-page.component').then(
        (mod) => mod.TreeSelectPageComponent
      )
  },
  {
    matcher: pathMatcher('autocomplete'),
    title: 'Autocomplete',
    loadComponent: () =>
      import('./pages/autocomplete-page/autocomplete-page.component').then(
        (mod) => mod.AutocompletePageComponent
      )
  },
  {
    matcher: pathMatcher('tree-autocomplete'),
    title: 'Tree autocomplete',
    loadComponent: () =>
      import(
        './pages/tree-autocomplete-page/tree-autocomplete-page.component'
      ).then((mod) => mod.TreeAutocompletePageComponent)
  },
  {
    matcher: pathMatcher('button'),
    title: 'Button',
    loadComponent: () =>
      import('./pages/button-page/button-page.component').then(
        (mod) => mod.ButtonPageComponent
      )
  },
  {
    matcher: pathMatcher('button-toggle'),
    title: 'Button toggle',
    loadComponent: () =>
      import('./pages/button-toggle-page/button-toggle-page.component').then(
        (mod) => mod.ButtonTogglePageComponent
      )
  },
  {
    matcher: pathMatcher('checkbox'),
    title: 'Checkbox',
    loadComponent: () =>
      import('./pages/checkbox-page/checkbox-page.component').then(
        (mod) => mod.CheckboxPageComponent
      )
  },
  {
    matcher: pathMatcher('switch'),
    title: 'Switch',
    loadComponent: () =>
      import('./pages/switch-page/switch-page.component').then(
        (mod) => mod.SwitchPageComponent
      )
  },
  {
    matcher: pathMatcher('radio-group'),
    title: 'Radio',
    loadComponent: () =>
      import('./pages/radio-page/radio-page.component').then(
        (mod) => mod.RadioPageComponent
      )
  },
  {
    matcher: pathMatcher('table'),
    title: 'Table',
    loadComponent: () =>
      import('./pages/table-page/table-page.component').then(
        (mod) => mod.TablePageComponent
      )
  },
  {
    matcher: pathMatcher('tree-table'),
    title: 'Tree table',
    loadComponent: () =>
      import('./pages/tree-table-page/tree-table-page.component').then(
        (mod) => mod.TreeTablePageComponent
      )
  },
  {
    matcher: pathMatcher('tag'),
    title: 'Tag',
    loadComponent: () =>
      import('./pages/tag-page/tag-page.component').then(
        (mod) => mod.TagPageComponent
      )
  },
  {
    matcher: pathMatcher('chip'),
    title: 'Chip',
    loadComponent: () =>
      import('./pages/chip-page/chip-page.component').then(
        (mod) => mod.ChipPageComponent
      )
  },
  {
    matcher: pathMatcher('loader'),
    title: 'Loader',
    loadComponent: () =>
      import('./pages/loader-page/loader-page.component').then(
        (mod) => mod.LoaderPageComponent
      )
  },
  {
    matcher: pathMatcher('expansion-panel'),
    title: 'Expansion panel',
    loadComponent: () =>
      import(
        './pages/expansion-panel-page/expansion-panel-page.component'
      ).then((mod) => mod.ExpansionPanelPageComponent)
  },
  {
    matcher: pathMatcher('file-upload'),
    title: 'File upload',
    loadComponent: () =>
      import('./pages/file-upload-page/file-upload-page.component').then(
        (mod) => mod.FileUploadPageComponent
      )
  },
  {
    matcher: pathMatcher('progress-circular'),
    title: 'Progress circular',
    loadComponent: () =>
      import(
        './pages/progress-circular-page/progress-circular-page.component'
      ).then((mod) => mod.ProgressCircularPageComponent)
  },
  {
    matcher: pathMatcher('progress-linear'),
    title: 'Progress linear',
    loadComponent: () =>
      import(
        './pages/progress-linear-page/progress-linear-page.component'
      ).then((mod) => mod.ProgressLinearPageComponent)
  },
  {
    matcher: pathMatcher('info-circle'),
    title: 'Info circle',
    loadComponent: () =>
      import('./pages/info-circle-page/info-circle-page.component').then(
        (mod) => mod.InfoCirclePageComponent
      )
  },
  {
    matcher: pathMatcher('datepicker'),
    title: 'Datepicker',
    loadComponent: () =>
      import('./pages/datepicker-page/datepicker-page.component').then(
        (mod) => mod.DatepickerPageComponent
      )
  },
  {
    matcher: pathMatcher('dialog'),
    title: 'Dialog',
    loadComponent: () =>
      import('./pages/dialog-page/dialog-page.component').then(
        (mod) => mod.DialogPageComponent
      )
  },
  {
    matcher: pathMatcher('divider'),
    title: 'Divider',
    loadComponent: () =>
      import('./pages/divider-page/divider-page.component').then(
        (mod) => mod.DividerPageComponent
      )
  },
  {
    matcher: pathMatcher('menu'),
    title: 'Menu',
    loadComponent: () =>
      import('./pages/menu-page/menu-page.component').then(
        (mod) => mod.MenuPageComponent
      )
  },
  {
    matcher: pathMatcher('notification'),
    title: 'Notifications',
    loadComponent: () =>
      import('./pages/notification-page/notification-page.component').then(
        (mod) => mod.NotificationPageComponent
      )
  },
  {
    matcher: pathMatcher('paginator'),
    title: 'Paginator',
    loadComponent: () =>
      import('./pages/paginator-page/paginator-page.component').then(
        (mod) => mod.PaginatorPageComponent
      )
  },
  {
    matcher: pathMatcher('textarea'),
    title: 'Textarea',
    loadComponent: () =>
      import('./pages/textarea-page/textarea-page.component').then(
        (mod) => mod.TextareaPageComponent
      )
  },
  {
    matcher: pathMatcher('timepicker'),
    title: 'Timepicker',
    loadComponent: () =>
      import('./pages/timepicker-page/timepicker-page.component').then(
        (mod) => mod.TimepickerPageComponent
      )
  },
  {
    matcher: pathMatcher('tooltip'),
    title: 'Tooltip directive',
    loadComponent: () =>
      import('./pages/tooltip-page/tooltip-page.component').then(
        (mod) => mod.TooltipPageComponent
      )
  },
  {
    matcher: pathMatcher('scheduler'),
    title: 'Scheduler',
    loadComponent: () =>
      import('./pages/scheduler-page/scheduler-page.component').then(
        (mod) => mod.SchedulerPageComponent
      )
  },
  { path: '**', redirectTo: 'colors' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
