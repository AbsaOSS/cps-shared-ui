export const sidebarMenuExamples: Record<
  string,
  { html: string; ts?: string }
> = {
  basicUsage: {
    html: `
<cps-sidebar-menu
  [items]="items"
  [exactRoutes]="true"
  ariaLabel="Sidebar menu example"></cps-sidebar-menu>`,
    ts: `
items: CpsSidebarMenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'grid',
    url: '/'
  },
  {
    title: 'Favourites',
    icon: 'star',
    url: '/sidebar-menu/examples'
  },
  {
    title: 'Categories disabled',
    icon: 'book',
    url: '/',
    disabled: true
  },
  {
    title: 'Access menu',
    icon: 'access-lock',
    items: [
      { title: 'Requests', desc: 'Apply for access', url: '/' },
      {
        title: 'Approval',
        desc: 'Approve or reject access requests',
        url: '/'
      }
    ]
  },
  {
    title: 'Community menu',
    icon: 'users',
    items: [{ title: 'Questions', desc: 'See all questions', url: '/' }]
  },
  {
    title: 'Bookmarks menu disabled',
    icon: 'bookmark',
    disabled: true,
    items: [
      {
        title: 'Disabled cat',
        desc: 'This is not visible',
        url: '/'
      }
    ]
  }
];`
  }
};
