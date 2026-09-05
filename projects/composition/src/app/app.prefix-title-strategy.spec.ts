import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import {
  CPS_LOG_API_PROVIDER,
  CpsLogRecord,
  CpsNoopTelemetrySink,
  CpsTelemetrySink,
  provideCpsTelemetry
} from 'cps-telemetry';
import { AppLogApiProvider } from './services/app-log-api.provider';
import { AppPrefixTitleStrategy } from './app.prefix-title-strategy';

describe('AppPrefixTitleStrategy', () => {
  let strategy: AppPrefixTitleStrategy;
  let title: Title;

  /** Minimal router state; only `url` is read, plus `buildTitle` traversal. */
  function stateWithTitle(routeTitle?: string): RouterStateSnapshot {
    return {
      url: '/button',
      root: {
        children: [],
        routeConfig: { title: routeTitle },
        title: routeTitle
      }
    } as unknown as RouterStateSnapshot;
  }

  function logs(): CpsLogRecord[] {
    return TestBed.inject(AppLogApiProvider).getRecords();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCpsTelemetry({
          application: 'composition-test',
          environment: 'test',
          version: '0.0.0'
        }),
        { provide: CPS_LOG_API_PROVIDER, useExisting: AppLogApiProvider },
        { provide: CpsTelemetrySink, useClass: CpsNoopTelemetrySink },
        { provide: TitleStrategy, useClass: AppPrefixTitleStrategy }
      ]
    });
    strategy = TestBed.inject(TitleStrategy) as AppPrefixTitleStrategy;
    title = TestBed.inject(Title);
    jest.spyOn(title, 'setTitle');
  });

  afterEach(() => jest.restoreAllMocks());

  it('should prefix a route title', () => {
    jest.spyOn(strategy, 'buildTitle').mockReturnValue('Button');

    strategy.updateTitle(stateWithTitle('Button'));

    expect(title.setTitle).toHaveBeenCalledWith('CPS UI Kit - Button');
  });

  it('should fall back to the bare product name without a route title', () => {
    jest.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);

    strategy.updateTitle(stateWithTitle());

    expect(title.setTitle).toHaveBeenCalledWith('CPS UI Kit');
  });

  it('should not warn when the route has a title', () => {
    jest.spyOn(strategy, 'buildTitle').mockReturnValue('Button');

    strategy.updateTitle(stateWithTitle('Button'));

    expect(logs()).toHaveLength(0);
  });

  it('should warn, naming the route, when the title is missing', () => {
    jest.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);

    strategy.updateTitle(stateWithTitle());

    expect(logs()).toHaveLength(1);
    expect(logs()[0]).toMatchObject({
      level: 'warn',
      message: 'No title defined for route',
      context: 'TitleStrategy',
      metadata: { url: '/button' }
    });
  });
});
