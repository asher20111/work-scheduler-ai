import { useEffect, useMemo, useState } from 'react'

const today = '2026-09-18'

const seedTasks = [
  { id: 1, title: 'Plan sprint backlog', time: '09:00', date: today, priority: 'High', category: 'Work', completed: false, notes: 'Review deliverables and assign owners.', recurring: 'None' },
  { id: 2, title: 'Client follow-up', time: '12:30', date: today, priority: 'Medium', category: 'Communication', completed: false, notes: 'Send summary and confirm next review date.', recurring: 'None' },
  { id: 3, title: 'Deep work block', time: '15:00', date: today, priority: 'High', category: 'Focus', completed: true, notes: 'Complete feature notes and QA items.', recurring: 'Weekdays' },
  { id: 4, title: 'Weekly metrics review', time: '09:30', date: '2026-09-19', priority: 'Low', category: 'Admin', completed: false, notes: 'Update the team dashboard.', recurring: 'Weekly' }
]

const seedEvents = [
  { id: 1, title: 'Design sync', date: today, time: '10:00', location: 'Zoom' },
  { id: 2, title: 'Product review', date: today, time: '14:00', location: 'Conference room' },
  { id: 3, title: 'Standup', date: '2026-09-19', time: '09:30', location: 'Team channel' }
]

const initialMessages = [{ sender: 'ai', text: 'Hi! I can prioritize your work, suggest time blocks, and turn plans into tasks.' }]
const categories = ['Work', 'Focus', 'Communication', 'Admin']
const priorities = ['High', 'Medium', 'Low']
const blankForm = { title: '', time: '09:00', date: today, priority: 'Medium', category: 'Work', notes: '', recurring: 'None' }

function App() {
  const [tasks, setTasks] = useStoredState('workflow-ai-tasks', seedTasks)
  const [events, setEvents] = useStoredState('workflow-ai-events', seedEvents)
  const [messages, setMessages] = useStoredState('workflow-ai-chat', initialMessages)
  const [activeView, setActiveView] = useState('Dashboard')
  const [taskForm, setTaskForm] = useState(blankForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [prompt, setPrompt] = useState('')
  const [calcInput, setCalcInput] = useState('250*2+150')
  const [calcResult, setCalcResult] = useState('650')
  const [calendarConnected, setCalendarConnected] = useState(true)
  const [remindersConnected, setRemindersConnected] = useState(true)
  const [draggedId, setDraggedId] = useState(null)
  const [notice, setNotice] = useState('')

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.notes} ${task.category}`.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'All' || task.priority === filter || task.category === filter || (filter === 'Completed' && task.completed)
    return matchesSearch && matchesFilter
  }), [tasks, search, filter])

  const todayItems = useMemo(() => [
    ...tasks.filter((task) => task.date === today).map((task) => ({ ...task, kind: 'task' })),
    ...events.filter((event) => event.date === today).map((event) => ({ ...event, kind: 'event', category: 'Calendar' }))
  ].sort((a, b) => a.time.localeCompare(b.time)), [tasks, events])

  const completed = tasks.filter((task) => task.completed).length
  const focusHours = tasks.filter((task) => task.category === 'Focus' && !task.completed).length * 1.5

  function notify(text) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 2600)
  }

  function saveTask(event) {
    event.preventDefault()
    if (!taskForm.title.trim()) return
    if (editingId) {
      setTasks((current) => current.map((task) => task.id === editingId ? { ...task, ...taskForm, title: taskForm.title.trim() } : task))
      notify('Task updated')
    } else {
      setTasks((current) => [{ ...taskForm, id: Date.now(), title: taskForm.title.trim(), completed: false }, ...current])
      notify('Task added to your schedule')
    }
    setTaskForm(blankForm)
    setEditingId(null)
  }

  function editTask(task) {
    setTaskForm({ title: task.title, time: task.time, date: task.date, priority: task.priority, category: task.category, notes: task.notes, recurring: task.recurring || 'None' })
    setEditingId(task.id)
    setActiveView('Dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task))
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
    notify('Task removed')
  }

  function dropTask(date) {
    if (!draggedId) return
    setTasks((current) => current.map((task) => task.id === draggedId ? { ...task, date } : task))
    setDraggedId(null)
    notify(`Moved task to ${date}`)
  }

  function askAI() {
    const question = prompt.trim()
    if (!question) return
    const lower = question.toLowerCase()
    let answer = 'Try protecting one uninterrupted focus block, then group communication into a single afternoon window.'
    if (lower.includes('priority') || lower.includes('urgent')) answer = `Your next priority should be ${tasks.find((task) => !task.completed && task.priority === 'High')?.title || 'your highest-priority open task'}. I would handle blockers before routine admin work.`
    if (lower.includes('schedule') || lower.includes('plan')) answer = 'Suggested plan: 09:00 planning, 10:30 deep work, 12:30 follow-ups, 14:00 meetings, and 16:00 tomorrow-prep.'
    if (lower.includes('free') || lower.includes('time')) answer = `You currently have ${Math.max(0, 8 - focusHours).toFixed(1)} hours of estimated flexible capacity today.`
    if (lower.includes('reminder') || lower.includes('calendar')) answer = 'Use Apple Calendar for time-blocked events and Apple Reminders for actionable tasks. The export buttons create Apple-compatible files.'
    setMessages((current) => [...current, { sender: 'user', text: question }, { sender: 'ai', text: answer }])
    setPrompt('')
  }

  function calculate() {
    if (!/^[0-9+\-*/().%\s]+$/.test(calcInput)) return setCalcResult('Invalid input')
    try {
      const value = Function(`"use strict"; return (${calcInput})`)()
      setCalcResult(Number.isFinite(value) ? String(value) : 'Error')
    } catch { setCalcResult('Error') }
  }

  function exportCalendar() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WorkFlow AI//EN']
    events.forEach((event) => lines.push('BEGIN:VEVENT', `UID:${event.id}@workflow-ai`, `DTSTART:${event.date.replaceAll('-', '')}T${event.time.replace(':', '')}00`, `SUMMARY:${event.title}`, `LOCATION:${event.location || ''}`, 'END:VEVENT'))
    lines.push('END:VCALENDAR')
    downloadFile('workflow-calendar.ics', lines.join('\r\n'), 'text/calendar')
    notify('Calendar export downloaded')
  }

  function exportReminders() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WorkFlow AI Reminders//EN']
    tasks.filter((task) => !task.completed).forEach((task) => lines.push('BEGIN:VTODO', `UID:${task.id}@workflow-ai`, `SUMMARY:${task.title}`, `DUE:${task.date.replaceAll('-', '')}T${task.time.replace(':', '')}00`, `DESCRIPTION:${task.notes || ''}`, 'END:VTODO'))
    lines.push('END:VCALENDAR')
    downloadFile('workflow-reminders.ics', lines.join('\r\n'), 'text/calendar')
    notify('Reminders export downloaded')
  }

  const viewContent = activeView === 'Calendar' ? <CalendarView tasks={tasks} events={events} onDrop={dropTask} onDragStart={setDraggedId} /> : activeView === 'Reminders' ? <RemindersView tasks={filteredTasks} onToggle={toggleTask} onEdit={editTask} onDelete={deleteTask} /> : activeView === 'AI Planner' ? <AIView messages={messages} prompt={prompt} setPrompt={setPrompt} askAI={askAI} /> : activeView === 'Calculator' ? <CalculatorView input={calcInput} setInput={setCalcInput} result={calcResult} calculate={calculate} /> : <Dashboard tasks={filteredTasks} todayItems={todayItems} taskForm={taskForm} setTaskForm={setTaskForm} saveTask={saveTask} editingId={editingId} onToggle={toggleTask} onEdit={editTask} onDelete={deleteTask} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} onDragStart={setDraggedId} />

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-wrap"><div className="brand-badge">WF</div><div><p className="eyebrow">Productivity suite</p><h2>WorkFlow AI</h2></div></div>
      <nav className="nav">{['Dashboard', 'Calendar', 'Reminders', 'AI Planner', 'Calculator'].map((view) => <button key={view} className={`nav-item ${activeView === view ? 'active' : ''}`} onClick={() => setActiveView(view)}>{view}</button>)}</nav>
      <div className="mini-card"><p className="eyebrow">Apple-compatible sync</p><SyncRow label="Calendar" connected={calendarConnected} onClick={() => setCalendarConnected(!calendarConnected)} /><SyncRow label="Reminders" connected={remindersConnected} onClick={() => setRemindersConnected(!remindersConnected)} /><button className="text-btn" onClick={exportCalendar}>Export Calendar .ics</button><button className="text-btn" onClick={exportReminders}>Export Reminders</button></div>
      <div className="mini-card capacity-card"><p className="eyebrow">Today’s capacity</p><strong>{Math.max(0, 8 - focusHours).toFixed(1)}h</strong><span>estimated flexible time</span></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><div><p className="eyebrow">Tuesday, Sep 18 · 2026</p><h1>{activeView === 'Dashboard' ? 'Work schedule overview' : activeView}</h1></div><div className="top-actions"><button className="ghost-btn" onClick={exportCalendar}>Export</button><button className="primary-btn" onClick={() => { setTaskForm(blankForm); setEditingId(null); setActiveView('Dashboard') }}>+ New task</button></div></header>
      <section className="summary-grid"><Summary label="Open tasks" value={tasks.length - completed} detail="Need attention" color="blue" /><Summary label="Completed" value={completed} detail="Finished this week" color="purple" /><Summary label="Focus time" value={`${focusHours.toFixed(1)}h`} detail="Available blocks" color="gold" /><Summary label="Events" value={events.length} detail="Calendar events" color="teal" /></section>
      {viewContent}
    </main>
    {notice && <div className="toast">✓ {notice}</div>}
  </div>
}

function Dashboard({ tasks, todayItems, taskForm, setTaskForm, saveTask, editingId, onToggle, onEdit, onDelete, search, setSearch, filter, setFilter, onDragStart }) {
  return <section className="content-grid"><div className="left-stack"><div className="panel"><div className="panel-header"><h3>{editingId ? 'Edit task' : 'Plan a task'}</h3><span className="soft-label">Local-first</span></div><form className="task-form" onSubmit={saveTask}><input required placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /><div className="two-col"><input type="date" value={taskForm.date} onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })} /><input type="time" value={taskForm.time} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} /></div><div className="two-col"><select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>{priorities.map((value) => <option key={value}>{value}</option>)}</select><select value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}>{categories.map((value) => <option key={value}>{value}</option>)}</select></div><select value={taskForm.recurring} onChange={(e) => setTaskForm({ ...taskForm, recurring: e.target.value })}><option>None</option><option>Weekdays</option><option>Weekly</option><option>Monthly</option></select><textarea rows="3" placeholder="Notes" value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} /><button className="primary-btn wide-btn">{editingId ? 'Save changes' : 'Add to schedule'}</button></form></div><div className="panel"><div className="panel-header"><h3>Today’s timeline</h3><span className="soft-label">Apple-ready</span></div><Timeline items={todayItems} /></div></div><div className="right-stack"><div className="panel"><div className="panel-header"><h3>Task inbox</h3><span className="soft-label">{tasks.length} shown</span></div><div className="filter-row"><input placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option><option>High</option><option>Medium</option><option>Low</option><option>Completed</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></div><div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} />)}{tasks.length === 0 && <p className="empty">No matching tasks.</p>}</div></div><div className="panel tip-panel"><p className="eyebrow">Planning tip</p><h3>Protect your best hour.</h3><p>Use Focus tasks for work that needs uninterrupted attention and let AI group the rest.</p></div></div></section>
}

function CalendarView({ tasks, events, onDrop, onDragStart }) {
  const dates = [today, '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22']
  return <section className="panel calendar-view"><div className="panel-header"><div><h3>Planning calendar</h3><p className="muted">Drag tasks between days to reschedule.</p></div><span className="soft-label">Week view</span></div><div className="calendar-grid">{dates.map((date) => <div className="day-column" key={date} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(date)}><div className="day-heading"><strong>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</strong><span>{date.slice(8)}</span></div>{events.filter((item) => item.date === date).map((event) => <div className="calendar-event" key={event.id}><small>{event.time}</small><strong>{event.title}</strong><span>{event.location}</span></div>)}{tasks.filter((item) => item.date === date).map((task) => <div className={`calendar-task ${task.completed ? 'done' : ''}`} draggable key={task.id} onDragStart={() => onDragStart(task.id)}><small>{task.time}</small><strong>{task.title}</strong><span>{task.category}</span></div>)}</div>)}</div></section>
}

function RemindersView({ tasks, onToggle, onEdit, onDelete }) { return <section className="panel full-panel"><div className="panel-header"><div><h3>Reminder inbox</h3><p className="muted">Actionable work ready for Apple Reminders export.</p></div><span className="soft-label">{tasks.filter((task) => !task.completed).length} open</span></div><div className="task-list large-list">{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</div></section> }

function AIView({ messages, prompt, setPrompt, askAI }) { return <section className="panel full-panel ai-panel"><div className="panel-header"><div><h3>AI planner</h3><p className="muted">Your private planning copilot runs with local scheduling data.</p></div><span className="soft-label">Smart assistance</span></div><div className="chat-box tall-chat">{messages.map((message, index) => <div key={index} className={`chat-message ${message.sender}`}>{message.text}</div>)}</div><div className="chat-input-row"><input placeholder="Ask AI to plan my day..." value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askAI()} /><button className="primary-btn" onClick={askAI}>Send</button></div></section> }

function CalculatorView({ input, setInput, result, calculate }) { return <section className="panel calculator-panel full-panel"><div className="panel-header"><div><h3>Work calculator</h3><p className="muted">Calculate budgets, hours, and split costs.</p></div><span className="soft-label">Quick math</span></div><input className="calculator-input large-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && calculate()} /><div className="calc-actions"><button className="primary-btn" onClick={calculate}>Calculate</button><div className="result-box">{result}</div></div><div className="calculator-keys">{['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '%', '+'].map((key) => <button key={key} onClick={() => setInput((value) => value + key)}>{key}</button>)}</div></section> }

function TaskRow({ task, onToggle, onEdit, onDelete, onDragStart }) { return <div className={`task-row ${task.completed ? 'completed' : ''}`} draggable={Boolean(onDragStart)} onDragStart={() => onDragStart?.(task.id)}><button className={`check-btn ${task.completed ? 'checked' : ''}`} onClick={() => onToggle(task.id)}>{task.completed ? '✓' : ''}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.date} · {task.time} · {task.category}{task.recurring !== 'None' ? ` · ${task.recurring}` : ''}</span></div><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><button className="row-action" onClick={() => onEdit(task)}>Edit</button><button className="row-action danger" onClick={() => onDelete(task.id)}>×</button></div> }
function Timeline({ items }) { return <div className="timeline-list">{items.map((item) => <div key={`${item.kind}-${item.id}`} className="timeline-item"><div className="time-dot" /><div className="timeline-copy"><div className="title-row"><strong>{item.title}</strong><span className={`tag ${item.kind === 'event' ? 'calendar-tag' : 'task-tag'}`}>{item.kind === 'event' ? 'Calendar' : item.category}</span></div><p>{item.time}{item.location ? ` · ${item.location}` : ''}</p></div></div>)}{items.length === 0 && <p className="empty">Nothing scheduled today.</p>}</div> }
function Summary({ label, value, detail, color }) { return <article className={`summary-card accent-${color}`}><p>{label}</p><h3>{value}</h3><span>{detail}</span></article> }
function SyncRow({ label, connected, onClick }) { return <button className="sync-row" onClick={onClick}><span>{label}</span><span className={`status-pill ${connected ? 'online' : 'offline'}`}>{connected ? 'Connected' : 'Offline'}</span></button> }
function useStoredState(key, fallback) { const [value, setValue] = useState(() => { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback } catch { return fallback } }); useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]); return [value, setValue] }
function downloadFile(name, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url) }

export default App
