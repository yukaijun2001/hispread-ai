import { createRouter, createWebHashHistory, type RouteComponent, type RouteRecordRaw } from 'vue-router';
import { ROUTE_IDS, type RouteId } from './navigation/access';

const pages: Partial<Record<RouteId, () => Promise<RouteComponent>>> = {
  workbench: () => import('./pages/workbench/WorkbenchPage.vue'),
  quotes: () => import('./pages/quotes/QuotesPage.vue'),
  settlements: () => import('./pages/settlements/SettlementsPage.vue'),
  suppliers: () => import('./pages/suppliers/SuppliersPage.vue'),
  'operator-kpi': () => import('./pages/suppliers/OperatorKpiPage.vue'),
  'supplier-accounts': () => import('./pages/suppliers/SupplierAccountsPage.vue'),
  'payout-recipients': () => import('./pages/suppliers/SupplierAccountsPage.vue'),
  projects: () => import('./pages/projects/ProjectsPage.vue'),
  'supplier-agents': () => import('./pages/team/SupplierAgentsPage.vue'),
  'outbound-proxies': () => import('./pages/proxies/OutboundProxiesPage.vue'),
  users: () => import('./pages/system/UsersPage.vue'),
  roles: () => import('./pages/system/RolesPage.vue'),
  audits: () => import('./pages/system/AuditsPage.vue'),
  deliveries: () => import('./pages/resources/ResourcesPage.vue'),
  'deliveries-pending': () => import('./pages/resources/ResourcesPage.vue'),
  resources: () => import('./pages/resources/ResourcesPage.vue'),
  'resources-pending': () => import('./pages/resources/ResourcesPage.vue'),
  'notice-admin': () => import('./pages/system/NoticeAdminPage.vue'),
  settings: () => import('./pages/system/SystemSettingsPage.vue'),
  'scheduled-tasks': () => import('./pages/system/ScheduledTasksPage.vue'),
  'scheduled-task-runs': () => import('./pages/system/ScheduledTaskRunsPage.vue'),
  reports: () => import('./pages/reports/ReportsPage.vue'),
  'ccmax-resource-analysis': () => import('./pages/reports/OnboardingStatisticsPage.vue'),
  'api-docs': () => import('./pages/api-docs/ApiDocsPage.vue'),
  notifications: () => import('./pages/notifications/NotificationsPage.vue'),
  'resource-targets': () => import('./pages/system/ResourceTargetsPage.vue'),
  'payout-providers': () => import('./pages/system/PayoutProvidersPage.vue'),
  'payout-calls': () => import('./pages/system/PayoutCallsPage.vue'),
};

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/workbench' },
  // Aliases kept for old notification links and bookmarks.
  { path: '/tasks', redirect: '/workbench' },
  { path: '/ops', redirect: (to) => ({ path: '/resources', query: to.query }) },
  ...ROUTE_IDS.map((id): RouteRecordRaw => {
    const component = pages[id];
    if (!component) throw new Error(`Missing page for route ${id}`);
    return {
    path: `/${id}`,
    name: id,
    component,
    props: { route: id },
    };
  }),
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./shell/ForbiddenView.vue') },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});
