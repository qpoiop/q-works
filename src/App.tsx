import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppNotification, Task, TaskForm, ViewKey } from './types'
import type { MyFilter } from './config/meta'
import { NAV_ITEMS, TOAST_COLOR } from './config/meta'
import { useStore } from './store/AppStore'
import { diffDays, toDateStr, today } from './lib/date'
import { checkDeadlines, fireBrowserNotif, notifPermission, notifSupported } from './lib/notify'
import { usePwaInstall } from './lib/usePwaInstall'
import AuthPage from './components/AuthPage'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Header from './components/Header'
import { InstallBanner, NotifPermissionBanner } from './components/Banners'
import NotificationPanel from './components/NotificationPanel'
import TaskModal from './components/TaskModal'
import ConfirmDialog from './components/ConfirmDialog'
import ProfileMenu from './components/ProfileMenu'
import SettingsModal from './components/SettingsModal'
import Toasts from './components/Toasts'
import ErrorState from './components/ErrorState'
import SkeletonList from './components/Skeleton'
import TodayView from './views/TodayView'
import MyTasksView from './views/MyTasksView'
import TimelineView from './views/TimelineView'
import MilestoneView from './views/MilestoneView'
import CalendarView from './views/CalendarView'
import TeamView from './views/TeamView'

const MOBILE_BREAKPOINT = 860

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

function blankForm(assignee: string): TaskForm {
  return {
    id: null, title: '', content: '', assignee, due: toDateStr(today()),
    priority: '보통', status: '예정', tags: '', isPublic: false, allowEdit: true,
    notify: { update: true, remind: true, deadline: true }
  }
}

export default function App() {
  const store = useStore()
  const { tasks, roster, me, milestones, notifications } = store
  const isMobile = useIsMobile()

  const [view, setView] = useState<ViewKey>('today')
  const [myFilter, setMyFilter] = useState<MyFilter>('전체')
  const [notifOpen, setNotifOpen] = useState(false)
  const [modalForm, setModalForm] = useState<TaskForm | null>(null)
  const [modalReadOnly, setModalReadOnly] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmLeaveTeam, setConfirmLeaveTeam] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [permission, setPermission] = useState(notifPermission())
  const now = today()
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const pwa = usePwaInstall()

  const inTeam = !!me?.teamCode
  const unread = notifications.filter((n) => !n.read).length
  const badgeCount = useMemo(
    () => tasks.filter((t) => t.assignee === me?.nickname && t.status !== '완료' && diffDays(t.due) <= 0).length,
    [tasks, me]
  )

  // 로그인 완료 후 권한이 이미 허용돼 있으면 마감 임박 브라우저 알림
  useEffect(() => {
    if (store.auth === 'authed' && permission === 'granted') checkDeadlines(tasks, me?.nickname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.auth, me?.nickname])

  const navigate = (v: ViewKey) => {
    setView(v)
    setNotifOpen(false)
    setProfileOpen(false)
  }

  const openEdit = useCallback((id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    setNotifOpen(false)
    setModalReadOnly(!store.canEdit(t))
    setModalForm({
      id: t.id, title: t.title, content: t.content, assignee: t.assignee, due: t.due,
      priority: t.priority, status: t.status, tags: t.tags.join(', '),
      isPublic: t.isPublic, allowEdit: t.allowEdit !== false, notify: { ...t.notify }
    })
  }, [tasks, store])

  const openCreate = () => {
    setModalReadOnly(false)
    setModalForm(blankForm(me?.nickname ?? ''))
  }

  /** 완료 토글 — 권한 없으면 시안 문구 토스트 */
  const handleToggle = (id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    if (!store.canEdit(t)) {
      store.toast('다른 담당자가 편집을 제한한 업무예요', TOAST_COLOR.danger)
      return
    }
    store.toggleDone(id)
  }

  const handleSave = async (form: TaskForm) => {
    if (await store.saveTask(form)) setModalForm(null)
  }
  const handleDeleteConfirmed = async () => {
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setModalForm(null)
    if (id) await store.deleteTask(id)
  }

  const toggleNotifPanel = () => {
    const opening = !notifOpen
    setNotifOpen(opening)
    setProfileOpen(false)
    if (opening) store.markAllRead()
  }

  const openFromNotification = (n: AppNotification) => {
    const t = tasks.find((x) => x.id === n.taskId) ?? tasks.find((x) => x.title === n.taskTitle)
    setNotifOpen(false)
    if (t) openEdit(t.id)
  }

  const enableNotif = () => {
    if (!notifSupported()) {
      store.toast('이 브라우저는 알림을 지원하지 않아요', TOAST_COLOR.danger)
      return
    }
    Notification.requestPermission().then((p) => {
      setPermission(p)
      if (p === 'granted') {
        store.toast('브라우저 알림을 켰어요', TOAST_COLOR.create)
        fireBrowserNotif('팀 작업 관리', '마감 임박·업데이트를 알려드릴게요.')
        checkDeadlines(tasks, me?.nickname)
      } else {
        store.toast('알림 권한이 거부됐어요', TOAST_COLOR.danger)
      }
    })
  }

  const testNotif = () => {
    if (!notifSupported()) {
      store.toast('알림을 지원하지 않는 브라우저예요', TOAST_COLOR.danger)
      return
    }
    if (Notification.permission === 'granted') {
      const sample = notifications[0]
      fireBrowserNotif(sample?.taskTitle ?? '팀 작업 관리', (sample?.desc ?? '알림이 잘 동작해요.') + ' (테스트)')
      store.toast('테스트 알림을 보냈어요', TOAST_COLOR.edit)
    } else {
      enableNotif()
    }
  }

  const install = async () => {
    const native = await pwa.install()
    if (!native) store.toast('브라우저 메뉴 → "홈 화면에 추가"로 설치할 수 있어요', TOAST_COLOR.edit)
  }

  // ---- 인증 게이트 ----
  if (store.auth === 'anon') {
    return (
      <>
        <AuthPage />
        <Toasts toasts={store.toasts} onUndo={() => {}} />
      </>
    )
  }

  const navItem = NAV_ITEMS.find((n) => n.key === view)!
  const subtitle = typeof navItem.subtitle === 'function' ? navItem.subtitle(today()) : navItem.subtitle
  const teamLabel = me?.teamName ?? '무소속'

  const viewBody = () => {
    if (store.auth === 'loading') return <SkeletonList count={5} />
    if (store.error) return <ErrorState message={store.error} onRetry={store.reload} />
    const common = { canEdit: store.canEdit, onOpen: openEdit, onToggle: handleToggle }
    switch (view) {
      case 'today':
        return (
          <>
            {pwa.bannerOpen && <InstallBanner onInstall={install} onDismiss={pwa.dismiss} />}
            {permission !== 'granted' && <NotifPermissionBanner onEnable={enableNotif} />}
            <TodayView tasks={tasks} me={me} {...common} />
          </>
        )
      case 'mytasks':
        return <MyTasksView tasks={tasks} me={me} filter={myFilter} onFilter={setMyFilter} {...common} />
      case 'timeline':
        return <TimelineView tasks={tasks} me={me} {...common} />
      case 'milestone':
        return <MilestoneView milestones={milestones} tasks={tasks} inTeam={inTeam} onOpen={openEdit} />
      case 'calendar':
        return (
          <CalendarView
            tasks={tasks} me={me} year={cal.y} month={cal.m}
            onShift={(d) => setCal(({ y, m }) => {
              let ny = y, nm = m + d
              if (nm < 0) { nm = 11; ny-- }
              if (nm > 11) { nm = 0; ny++ }
              return { y: ny, m: nm }
            })}
            onToday={() => setCal({ y: now.getFullYear(), m: now.getMonth() })}
            onOpen={openEdit}
          />
        )
      case 'team':
        return <TeamView tasks={tasks} inTeam={inTeam} {...common} />
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#eef0f3', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {!isMobile && (
          <Sidebar view={view} onNavigate={navigate} badgeCount={badgeCount} me={me} onProfile={() => setProfileOpen((v) => !v)} />
        )}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header
            title={navItem.title} subtitle={subtitle} unreadCount={unread}
            onBell={toggleNotifPanel} onNew={openCreate}
            isMobile={isMobile} me={me} onProfile={() => setProfileOpen((v) => !v)}
          />
          <div style={{ flex: 1, overflowY: 'auto', padding: 22 }} key={view}>
            <div className="anim-fade" style={{ maxWidth: 940, margin: '0 auto' }}>{viewBody()}</div>
          </div>
        </main>
      </div>

      {isMobile && <MobileNav view={view} onNavigate={navigate} />}

      {profileOpen && me && (
        <ProfileMenu
          nickname={me.nickname} avatar={me.avatar} teamLabel={teamLabel}
          onSettings={() => { setProfileOpen(false); setSettingsOpen(true) }}
          onLogout={() => { setProfileOpen(false); store.logout() }}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {settingsOpen && me && (
        <SettingsModal
          me={me}
          onClose={() => setSettingsOpen(false)}
          onLeaveTeam={() => setConfirmLeaveTeam(true)}
        />
      )}

      {notifOpen && (
        <NotificationPanel
          notifications={notifications}
          onClose={toggleNotifPanel}
          onTest={testNotif}
          onOpenNotification={openFromNotification}
        />
      )}

      {modalForm && (
        <TaskModal
          form={modalForm}
          isEdit={!!modalForm.id}
          readOnly={modalReadOnly}
          memberNames={roster.map((r) => r.nickname)}
          onSave={handleSave}
          onDelete={() => setConfirmDeleteId(modalForm.id)}
          onClose={() => setModalForm(null)}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="업무 삭제"
          message="이 업무를 삭제할까요? 삭제한 업무는 되돌릴 수 없어요."
          confirmLabel="삭제"
          danger
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {confirmLeaveTeam && (
        <ConfirmDialog
          title="팀 나가기"
          message={`${teamLabel}에서 나갈까요? 팀의 공개 업무·타임라인·마일스톤을 더 이상 볼 수 없어요.`}
          confirmLabel="나가기"
          danger
          onConfirm={() => { setConfirmLeaveTeam(false); setSettingsOpen(false); store.leaveTeam() }}
          onCancel={() => setConfirmLeaveTeam(false)}
        />
      )}

      <Toasts toasts={store.toasts} onUndo={(taskId, toastId) => { store.toggleDone(taskId); store.dismissToast(toastId) }} />
    </div>
  )
}
