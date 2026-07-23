const changeTabTs = `
changeTab({ newIndex }: CpsTabChangeEvent) {
  console.log('Tab changed to: ' + newIndex);
}`;

export const tabGroupExamples: Record<string, { html: string; ts?: string }> = {
  centerAlignedTabs: {
    html: `
<cps-tab-group
  tabsBackground="bg-light"
  alignment="center"
  [selectedIndex]="selectedTabIndex"
  (afterTabChanged)="changeTab($event)">
  @for (tab of centerAlignedTabs; track tab.label) {
    <cps-tab
      [label]="tab.label"
      [badgeValue]="tab.badgeValue"
      [badgeTooltip]="tab.badgeTooltip"
      [disabled]="tab.disabled">
      <cps-checkbox
        [label]="'Checkbox of ' + tab.label.toLowerCase()"></cps-checkbox>
    </cps-tab>
  }
</cps-tab-group>`,
    ts: `
selectedTabIndex = 1;

centerAlignedTabs = [
  {
    label: 'Tab 1',
    badgeValue: '7',
    badgeTooltip: 'First tab badge',
    disabled: false
  },
  { label: 'Tab 2', badgeValue: '', badgeTooltip: '', disabled: false },
  {
    label: 'Tab 3',
    badgeValue: '5',
    badgeTooltip: 'Third tab badge',
    disabled: false
  },
  { label: 'Tab 4', badgeValue: '', badgeTooltip: '', disabled: true }
];

${changeTabTs.trim()}`
  },

  leftAlignedTabs: {
    html: `
<cps-tab-group
  animationType="fade"
  tabsBackground="bg-light"
  (afterTabChanged)="changeTab($event)">
  @for (tab of leftAlignedTabs; track tab.label) {
    <cps-tab [label]="tab.label" [tooltipText]="tab.tooltipText">
      {{ 'Content of ' + tab.label.toLowerCase() }}
    </cps-tab>
  }
</cps-tab-group>`,
    ts: `
leftAlignedTabs = Array.from({ length: 20 }, (_, i) => ({
  label: \`Tab \${i + 1}\`,
  tooltipText: \`Tooltip of tab \${i + 1}\`
}));

${changeTabTs.trim()}`
  },

  rightAlignedTabs: {
    html: `
<cps-tab-group
  alignment="right"
  [autoActivation]="false"
  (afterTabChanged)="changeTab($event)"
  tabsBackground="bg-light">
  @for (tab of rightAlignedTabs; track tab.label) {
    <cps-tab [label]="tab.label" [icon]="tab.icon" [attr.id]="tab.id">
      {{ 'Content of ' + tab.label.toLowerCase() }}
    </cps-tab>
  }
</cps-tab-group>`,
    ts: `
rightAlignedTabs = [
  { label: 'Tab 1', icon: 'survivorship', id: 'tab1' },
  { label: 'Tab 2', icon: 'kris', id: null },
  { label: 'Tab 3', icon: 'dq', id: null }
];

${changeTabTs.trim()}`
  },

  stretchedTabs: {
    html: `
<cps-tab-group
  tabsBackground="bg-light"
  [stretched]="true"
  (afterTabChanged)="changeTab($event)">
  @for (tab of stretchedTabs; track tab.label) {
    <cps-tab [label]="tab.label">
      {{ 'Content of ' + tab.label.toLowerCase() }}
    </cps-tab>
  }
</cps-tab-group>`,
    ts: `
stretchedTabs = [{ label: 'Tab 1' }, { label: 'Tab 2' }, { label: 'Tab 3' }];

${changeTabTs.trim()}`
  },

  subTabs: {
    html: `
<cps-tab-group
  [isSubTabs]="true"
  tabsBackground="bg-light"
  animationType="fade"
  (afterTabChanged)="changeTab($event)">
  @for (tab of subTabs; track tab.label) {
    <cps-tab [label]="tab.label" [icon]="tab.icon" [attr.id]="tab.id">
      {{ 'Content of ' + tab.label.toLowerCase() }}
    </cps-tab>
  }
</cps-tab-group>`,
    ts: `
subTabs = [
  { label: 'Tab 1', icon: 'avatar', id: 'tab1' },
  { label: 'Tab 2', icon: '', id: null },
  { label: 'Tab 3', icon: '', id: null }
];

${changeTabTs.trim()}`
  }
};
