const menuItemsTs = `
items: CpsMenuItem[] = [
  {
    title: 'First item',
    desc: 'First item description',
    icon: 'remove',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Second item',
    desc: 'Second item is disabled',
    icon: 'bell',
    disabled: true,
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Third item',
    icon: 'browse',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Fourth item',
    desc: 'Fourth item description',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Fifth item',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    ariaLabel: 'Sixth item is loading',
    loading: true
  },
  {
    title: 'Go google',
    url: 'https://google.com',
    target: '_blank'
  }
];

doConsoleLog(event: any) {
  console.log(event.item.title + ' clicked');
}`;

const itemsWithoutIconsTs = `
itemsWithoutIcons: CpsMenuItem[] = [
  {
    title: 'First item',
    desc: 'First item description',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Second item',
    desc: 'Second item is disabled',
    disabled: true,
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Third item',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Fourth item',
    desc: 'Fourth item description',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    title: 'Fifth item',
    action: (event: any) => {
      this.doConsoleLog(event);
    }
  },
  {
    ariaLabel: 'Sixth item is loading',
    loading: true
  },
  {
    title: 'Go google',
    url: 'https://google.com',
    target: '_blank'
  }
];

doConsoleLog(event: any) {
  console.log(event.item.title + ' clicked');
}`;

export const menuExamples: Record<string, { html: string; ts?: string }> = {
  standardMenu: {
    html: `
<cps-menu
  #standardMenu
  [items]="items"
  header="Menu header"
  (menuShown)="isStandardMenuOpen = true"
  (menuHidden)="isStandardMenuOpen = false">
</cps-menu>
<cps-button
  label="Standard menu"
  ariaHaspopup="menu"
  [ariaExpanded]="isStandardMenuOpen"
  (clicked)="standardMenu.toggle($event)">
</cps-button>`,
    ts: `
${menuItemsTs.trim()}

isStandardMenuOpen = false;`
  },

  standardMenuNoHeader: {
    html: `
<cps-menu
  #standardMenuNoHeader
  [items]="items"
  ariaLabel="Menu with aria label"
  (menuShown)="isStandardMenuNoHeaderOpen = true"
  (menuHidden)="isStandardMenuNoHeaderOpen = false">
</cps-menu>
<cps-button
  label="Standard menu without header"
  ariaHaspopup="menu"
  [ariaExpanded]="isStandardMenuNoHeaderOpen"
  (clicked)="standardMenuNoHeader.toggle($event)">
</cps-button>`,
    ts: `
${menuItemsTs.trim()}

isStandardMenuNoHeaderOpen = false;`
  },

  compressedMenu: {
    html: `
<cps-menu
  #compressedMenu
  [items]="items"
  [compressed]="true"
  [withArrow]="false"
  (menuShown)="isCompressedMenuOpen = true"
  (menuHidden)="isCompressedMenuOpen = false">
</cps-menu>
<cps-button
  label="Compressed menu"
  ariaHaspopup="menu"
  [ariaExpanded]="isCompressedMenuOpen"
  (clicked)="compressedMenu.toggle($event)">
</cps-button>`,
    ts: `
${menuItemsTs.trim()}

isCompressedMenuOpen = false;`
  },

  compressedMenuNoIcons: {
    html: `
<cps-menu
  #compressedMenuNoIcons
  [items]="itemsWithoutIcons"
  [compressed]="true"
  [withArrow]="false"
  (menuShown)="isCompressedMenuNoIconsOpen = true"
  (menuHidden)="isCompressedMenuNoIconsOpen = false">
</cps-menu>
<cps-button
  label="Compressed menu without icons"
  ariaHaspopup="menu"
  [ariaExpanded]="isCompressedMenuNoIconsOpen"
  (clicked)="compressedMenuNoIcons.toggle($event)">
</cps-button>`,
    ts: `
${itemsWithoutIconsTs.trim()}

isCompressedMenuNoIconsOpen = false;`
  },

  arbitraryContentMenu: {
    html: `
<cps-menu
  #arbitraryMenu
  (menuShown)="isArbitraryMenuOpen = true"
  (menuHidden)="isArbitraryMenuOpen = false">
  <div>
    <span>Provide your own content here</span>
    <img
      src="https://cdn.pixabay.com/photo/2014/11/30/14/11/cat-551554_960_720.jpg"
      alt="kitten"
      width="200" />
    <a href="https://www.google.com/" target="_blank" rel="noopener noreferrer">Google</a>
    <a href="https://www.bing.com/" target="_blank" rel="noopener noreferrer">Bing</a>
  </div>
</cps-menu>
<cps-button
  label="Menu with arbitrary content"
  ariaHaspopup="menu"
  [ariaExpanded]="isArbitraryMenuOpen"
  (clicked)="arbitraryMenu.toggle($event)">
</cps-button>`,
    ts: `
isArbitraryMenuOpen = false;`
  },

  openOnFocusMenu: {
    html: `
<cps-menu
  #focusMenu
  [items]="items"
  [focusOnShow]="false"
  (menuShown)="isFocusMenuOpen = true"
  (menuHidden)="isFocusMenuOpen = false">
</cps-menu>
<cps-button
  label="Menu that opens on focus"
  ariaHaspopup="menu"
  [ariaExpanded]="isFocusMenuOpen"
  (focusin)="focusMenu.show(null, $event.target)"
  (focusout)="onFocusMenuFocusOut($event, focusMenu)">
</cps-button>`,
    ts: `
${menuItemsTs.trim()}

isFocusMenuOpen = false;

onFocusMenuFocusOut(event: FocusEvent, menu: CpsMenuComponent) {
  if (!menu.container?.contains(event.relatedTarget as Node)) {
    menu.hide();
  }
}`
  },

  openOnHoverMenu: {
    html: `
<cps-menu
  #hoverMenu
  [items]="items"
  [focusOnShow]="false"
  (menuShown)="isHoverMenuOpen = true"
  (menuHidden)="isHoverMenuOpen = false"
  (containerMouseLeave)="onMenuLeave($event, hoverMenu)">
</cps-menu>
<cps-button
  label="Menu that opens on hover"
  ariaHaspopup="menu"
  [ariaExpanded]="isHoverMenuOpen"
  (mouseenter)="hoverMenu.show($event)"
  (mouseleave)="onMenuLeave($event, hoverMenu)"
  (focusin)="hoverMenu.show(null, $event.target)"
  (focusout)="onMenuLeave($event, hoverMenu)">
</cps-button>`,
    ts: `
${menuItemsTs.trim()}

isHoverMenuOpen = false;

onMenuLeave(event: MouseEvent | FocusEvent, menu: CpsMenuComponent) {
  const rel = event.relatedTarget as Node;
  if (
    !menu.container?.contains(rel) &&
    !(menu.target as HTMLElement)?.contains(rel)
  ) {
    menu.hide();
  }
}`
  }
};
