import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { AppLayout } from '../components/Layout/AppLayout'
import { MonitorsPage } from '../pages/MonitorsPage'
import { MonitorPage } from '../pages/MonitorPage'
import { LandingPage } from '../pages/LandingPage'
import { PublicMonitorsPage } from '../pages/PublicMonitorsPage'
import { PublicMonitorPage } from '../pages/PublicMonitorPage'

function RequireAuth() {
    const token = localStorage.getItem('access_token')
    if (!token) {
       return <Navigate to='/login' replace />
    }
    return <Outlet />
}

export const router = createBrowserRouter([
    // 1. ГЛАВНАЯ СТРАНИЦА (С ШАПКОЙ)
    {
       path: '/',
       element: (
           <AppLayout>
               <LandingPage />
           </AppLayout>
       ),
    },

    // 2. ЛОГИН (БЕЗ ШАПКИ)
    {
       path: '/login',
       element: <LoginPage />,
    },

    // 3. ПУБЛИЧНЫЙ ПРОСМОТР (С ШАПКОЙ)
    {
        path: '/view',
        element: <AppLayout><Outlet /></AppLayout>,
        children: [
            {
                path: 'projects/:projectId/monitors',
                element: <PublicMonitorsPage />
            },
            {
                path: 'monitors/:monitorId',
                element: <PublicMonitorPage />
            }
        ]
    },

    // 4. АДМИНКА (ТРЕБУЕТ ВХОД + ШАПКА)
    {
       path: '/app',
       element: <RequireAuth />,
       children: [
          {
             path: 'projects',
             element: (
                <AppLayout>
                   <ProjectsPage />
                </AppLayout>
             ),
          },
          {
             path: 'projects/:projectId/monitors',
             element: (
                <AppLayout>
                   <MonitorsPage />
                </AppLayout>
             ),
          },
          {
             path: 'monitors/:monitorId',
             element: (
                <AppLayout>
                   <MonitorPage />
                </AppLayout>
             ),
          },
       ],
    },

    {
       path: '*',
       element: <Navigate to='/login' replace />,
    },
])