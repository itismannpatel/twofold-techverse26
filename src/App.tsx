import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useApp } from './context/AppContext'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Discover } from './pages/Discover'
import { Matches } from './pages/Matches'
import { Profile } from './pages/Profile'
import { MyProfile } from './pages/MyProfile'
import { Sessions } from './pages/Sessions'
import { Chat } from './pages/Chat'

function ProtectedLayout() {
  const { user } = useApp()
  if (!user) return <Navigate to="/auth" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/messages" element={<Chat />} />
        <Route path="/messages/:partnerId" element={<Chat />} />
        <Route path="/u/:userId" element={<Profile />} />
        <Route path="/profile" element={<MyProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/discover" replace />} />
    </Routes>
  )
}
