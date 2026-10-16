import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../store/auth.js'

const CustomerLayout = () => import('../layouts/CustomerLayout.vue')
const AdminLayout = () => import('../layouts/AdminLayout.vue')

const routes = [
  {
    path: '/',
    component: CustomerLayout,
    children: [
      { path: '', name: 'home', component: () => import('../pages/customer/Home.vue'), meta: { title: 'SommyBite — Fresh Nigerian food, delivered' } },
      { path: 'shop', name: 'shop', component: () => import('../pages/customer/Shop.vue'), meta: { title: 'Menu — SommyBite' } },
      { path: 'product/:id', name: 'product', component: () => import('../pages/customer/ProductDetail.vue'), meta: { title: 'Menu — SommyBite' } },
      { path: 'cart', name: 'cart', component: () => import('../pages/customer/Cart.vue'), meta: { title: 'Cart — SommyBite' } },
      { path: 'checkout', name: 'checkout', component: () => import('../pages/customer/Checkout.vue'), meta: { title: 'Checkout — SommyBite' } },
      { path: 'confirmation/:orderId', name: 'confirmation', component: () => import('../pages/customer/Confirmation.vue'), meta: { title: 'Order placed — SommyBite' } },
      { path: 'auth', name: 'auth', component: () => import('../pages/customer/Auth.vue'), meta: { title: 'Sign in — SommyBite' } },
      { path: 'orders', name: 'orders', component: () => import('../pages/customer/Orders.vue'), meta: { title: 'My orders — SommyBite', requiresAuth: true } },
      { path: 'orders/:id', name: 'order-detail', component: () => import('../pages/customer/OrderDetail.vue'), meta: { title: 'Order — SommyBite', requiresAuth: true } },
      { path: 'about', name: 'about', component: () => import('../pages/customer/About.vue'), meta: { title: 'Our story — SommyBite' } },
      { path: 'contact', name: 'contact', component: () => import('../pages/customer/Contact.vue'), meta: { title: 'Contact — SommyBite' } },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin', component: () => import('../pages/admin/Overview.vue'), meta: { title: 'Dashboard — SommyBite Admin' } },
      { path: 'products', name: 'admin-products', component: () => import('../pages/admin/Products.vue'), meta: { title: 'Products — SommyBite Admin' } },
      { path: 'products/new', name: 'admin-product-new', component: () => import('../pages/admin/ProductForm.vue'), meta: { title: 'Add product — SommyBite Admin' } },
      { path: 'products/:id/edit', name: 'admin-product-edit', component: () => import('../pages/admin/ProductForm.vue'), meta: { title: 'Edit product — SommyBite Admin' } },
      { path: 'categories', name: 'admin-categories', component: () => import('../pages/admin/Categories.vue'), meta: { title: 'Categories — SommyBite Admin' } },
      { path: 'orders', name: 'admin-orders', component: () => import('../pages/admin/Orders.vue'), meta: { title: 'Orders — SommyBite Admin' } },
      { path: 'orders/:id', name: 'admin-order-detail', component: () => import('../pages/admin/OrderDetail.vue'), meta: { title: 'Order — SommyBite Admin' } },
    ],
  },
  { path: '/admin/login', name: 'admin-login', component: () => import('../pages/admin/Login.vue'), meta: { title: 'Admin sign in — SommyBite' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../pages/NotFound.vue'), meta: { title: 'Page not found — SommyBite' } },
]

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    return { top: 0 }
  },
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    return { path: '/auth', query: { next: to.fullPath } }
  }
  if (to.meta.requiresAdmin) {
    if (!auth.user) return { path: '/admin/login', query: { next: to.fullPath } }
    if (auth.user.role !== 'admin') return { path: '/admin/login', query: { next: to.fullPath } }
  }
  if (to.path === '/admin/login' && auth.user?.role === 'admin') {
    return { path: '/admin' }
  }
})

router.afterEach((to) => {
  const title = to.meta?.title
  if (title) document.title = title
})

export default router
