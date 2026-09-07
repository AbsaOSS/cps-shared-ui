import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLinkActive, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { CpsInputComponent } from 'cps-ui-kit';
import { AppTelemetryService } from '../../services/app-telemetry.service';

@Component({
  imports: [RouterModule, CommonModule, FormsModule, CpsInputComponent],
  selector: 'app-navigation-sidebar',
  templateUrl: './navigation-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./navigation-sidebar.component.scss']
})
export class NavigationSidebarComponent implements OnInit {
  @Input() isExpanded = true;
  @Output() linkClicked = new EventEmitter<void>();

  @ViewChildren(RouterLinkActive, { read: ElementRef })
  private _navLinks!: QueryList<ElementRef<HTMLAnchorElement>>;

  focusActiveLink(): boolean {
    if (!this.isExpanded) return false;
    const link = this._navLinks.find(
      (ref) => ref.nativeElement.getAttribute('aria-current') === 'page'
    );
    link?.nativeElement.focus();
    return !!link;
  }

  styles = [
    {
      title: 'Color pack',
      url: '/colors'
    }
    // extend this list
  ];

  private _components = [
    {
      title: 'Autocomplete',
      url: '/autocomplete'
    },
    {
      title: 'Button',
      url: '/button'
    },
    {
      title: 'Button toggle',
      url: '/button-toggle'
    },
    {
      title: 'Checkbox',
      url: '/checkbox'
    },
    {
      title: 'Chip',
      url: '/chip'
    },
    {
      title: 'Datepicker',
      url: '/datepicker'
    },
    {
      title: 'Dialog',
      url: '/dialog'
    },
    {
      title: 'Divider',
      url: '/divider'
    },
    {
      title: 'Expansion panel',
      url: '/expansion-panel'
    },
    {
      title: 'File upload',
      url: '/file-upload'
    },
    {
      title: 'Icon',
      url: '/icon'
    },
    {
      title: 'Info circle',
      url: '/info-circle'
    },
    {
      title: 'Input',
      url: '/input'
    },
    {
      title: 'Loader',
      url: '/loader'
    },
    {
      title: 'Menu',
      url: '/menu'
    },
    {
      title: 'Notifications',
      url: '/notification'
    },
    {
      title: 'Paginator',
      url: '/paginator'
    },
    {
      title: 'Progress circular',
      url: '/progress-circular'
    },
    {
      title: 'Progress linear',
      url: '/progress-linear'
    },
    {
      title: 'Radio',
      url: '/radio-group'
    },
    {
      title: 'Scheduler',
      url: '/scheduler'
    },
    {
      title: 'Select',
      url: '/select'
    },
    {
      title: 'Sidebar menu',
      url: '/sidebar-menu'
    },
    {
      title: 'Switch',
      url: '/switch'
    },
    {
      title: 'Table',
      url: '/table'
    },
    {
      title: 'Tabs',
      url: '/tab-group'
    },
    {
      title: 'Tag',
      url: '/tag'
    },
    {
      title: 'Textarea',
      url: '/textarea'
    },
    {
      title: 'Timepicker',
      url: '/timepicker'
    },
    {
      title: 'Tooltip directive',
      url: '/tooltip'
    },
    {
      title: 'Tree autocomplete',
      url: '/tree-autocomplete'
    },
    {
      title: 'Tree select',
      url: '/tree-select'
    },
    {
      title: 'Tree table',
      url: '/tree-table'
    }
    // extend this list
  ];

  filteredComponents: {
    title: string;
    url: string;
  }[] = [];

  searchVal = '';

  private readonly appTelemetry = inject(AppTelemetryService);
  private readonly destroyRef = inject(DestroyRef);

  /** Reports the search once typing pauses, not on every keystroke. */
  private readonly searchTelemetry$ = new Subject<string>();

  ngOnInit(): void {
    this.filteredComponents = [...this._components];

    this.searchTelemetry$
      .pipe(
        debounceTime(400),
        filter((value) => !!value),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.appTelemetry.trackClick('sidebar_searched', {
          resultCount: this.filteredComponents.length
        });
      });
  }

  onSearchChanged(value: string) {
    this._filterComponentsList(value);
    this.searchTelemetry$.next(value);
  }

  private _filterComponentsList(searchStr: string) {
    if (!searchStr) {
      this.filteredComponents = [...this._components];
      return;
    }
    searchStr = searchStr.toLowerCase();

    this.filteredComponents = this._components.filter((c) =>
      c.title.toLocaleLowerCase().includes(searchStr)
    );
  }

  onLinkClick() {
    if (this.searchVal) {
      // Resets the debounce timer so a pending search report doesn't fire after the search is cleared.
      this.searchTelemetry$.next('');
      this.searchVal = '';
      this.filteredComponents = [...this._components];
    }
    this.linkClicked.emit();
  }
}
