import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/life',
    name: 'Life',
    component: () => import('@/views/life/Life.vue'),
    meta: { title: '行前与在校生活', requiresAuth: false }
  },
  {
    path: '/life/map',
    name: 'LifeMap',
    component: () => import('@/views/life/LifeMap.vue'),
    meta: { title: '生活地图', requiresAuth: false }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: () => import('@/views/activities/Activities.vue'),
    meta: { title: '校园活动', requiresAuth: false }
  },
  {
    path: '/activities/:id',
    name: 'ActivityDetail',
    component: () => import('@/views/activities/ActivityDetail.vue'),
    meta: { title: '活动详情', requiresAuth: false }
  },
  {
    path: '/academics',
    name: 'Academics',
    component: () => import('@/views/academics/Academics.vue'),
    meta: { title: '学业支持', requiresAuth: false }
  },
  {
    path: '/career',
    name: 'Career',
    component: () => import('@/views/career/Career.vue'),
    meta: { title: '就业规划', requiresAuth: false }
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: () => import('@/views/PostDetail.vue'),
    meta: { title: '帖子详情', requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    redirect: '/login',
    meta: { title: '注册' }
  },
  {
    path: '/non-edu/verify',
    name: 'NonEduComplete',
    component: () => import('@/views/NonEduComplete.vue'),
    meta: { title: '账号设置', requiresAuth: false }
  },
  {
    path: '/tree-hole',
    name: 'TreeHole',
    component: () => import('@/views/TreeHole.vue'),
    meta: { title: '树洞', requiresAuth: true }
  },
  {
    path: '/notices',
    name: 'Notices',
    component: () => import('@/views/Notices.vue'),
    meta: { title: '通知' }
  },
  {
    path: '/o2o',
    name: 'O2O',
    component: () => import('@/views/O2O.vue'),
    meta: { title: 'O2O' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/profile/:id',
    name: 'UserProfile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '用户资料', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminConfig',
    component: () => import('@/views/AdminConfig.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/circles',
    name: 'Circles',
    component: () => import('@/views/Circles.vue'),
    meta: { title: '圈子', requiresAuth: true }
  },
  {
    path: '/circles/:id',
    name: 'CircleDetail',
    component: () => import('@/views/CircleDetail.vue'),
    meta: { title: '圈子详情', requiresAuth: true }
  },
  {
    path: '/circles/:id/manage',
    name: 'CircleManage',
    component: () => import('@/views/CircleManage.vue'),
    meta: { title: '圈子管理', requiresAuth: true }
  },
  {
    path: '/create-circle',
    name: 'CreateCircle',
    component: () => import('@/views/CreateCircle.vue'),
    meta: { title: '创建圈子', requiresAuth: true }
  },
  {
    path: '/following',
    name: 'FollowingFeed',
    component: () => import('@/views/FollowingFeed.vue'),
    meta: { title: '我的圈子动态', requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Messages.vue'),
    meta: { title: '私信', requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title} - 校园社区平台` || '校园社区平台'

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next('/login')
    } else {
      // 检查是否需要管理员权限
      if (to.meta.requiresAdmin) {
        // 从localStorage获取用户信息
        const userInfo = localStorage.getItem('user')
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo)
            if (user.role === 'admin') {
              next()
            } else {
              next('/') // 非管理员跳转到首页
            }
          } catch (e) {
            next('/') // 解析失败跳转到首页
          }
        } else {
          next('/') // 没有用户信息跳转到首页
        }
      } else {
        next()
      }
    }
  } else {
    next()
  }
})

export default router
