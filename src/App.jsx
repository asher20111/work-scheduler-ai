import { useEffect, useMemo, useState } from 'react'

const defaultTasks = [
  {
    id: 1,
    title: 'Plan sprint backlog',
    time: '09:00',
    date: '2026-09-18',
    priority: 'High',
    category: 'Work',
    completed: false,
    notes: 'Review deliverables and assign owners.'
  },
  {
    id: 2,
    title: 'Client follow-up',
    time: '12:30',
    date: '2026-09-18',
    priority: 'Medium',
    category: 'Communication',
    completed: false,
    notes: 'Send summary and confirm next review date.'
  },
  {
    id: 3,
    title: 'Deep work block',
    time: '15:00',
    date: '2026-09-18',
    priority: 'High',
    category: 'Focus',
    completed: true,
    notes: 'Complete feature notes and QA items.'
  }
]

const defaultEvents = [
  {
    id: 1,
    title: 'Design sync',
    date: '2026-09-18',
    time: '10:00',
    location: 'Zoom'
  },
  {
    id: 2,
    title: 'Product review',
    date: '2026-09-18',
    time: '14:00',
    location: 'Conference room'
  },
  {
    id: 3,
    title: 'Standup',
    date: '2026-09-19',
    time: '09:30',
    location: 'Team channel'
  }
]

const initialAssistantMessages = [
  {
    sender: 'ai',
    text: 'Hi! I can help schedule your work, suggest time blocks, and summarize priorities.'
  }
]

function App() {
  const [tasks, setTasks] = useState(() => {
    const stored = localStorage.getItem('workflow-ai-tasks')
    return stored ? JSON.parse(stored) : defaultTasks
  })

  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem('workflow-ai-events')
    return stored ? JSON.parse(stored) : defaultEvents
  })

  const [assistantMessages, setAssistantMessages] = useState(() => {
    const stored = localStorage.getItem('workflow-ai-chat')
    return stored ? JSON.parse(stored) : initialAssistantMessages
  })

  const [taskForm, setTaskForm] = useState({
    title: '',
    time: '09:00',
    date: '2026-09-18',
    priority: 'Medium',
    category: 'Work',
    notes: ''
  })

  const [calendarConnected, setCalendarConnected] = useState(true)
  const [remindersConnected, setRemindersConnected] = useState(true)
  const [userPrompt, setUserPrompt] = useState('')
  const [calculatorInput, setCalculatorInput] = useState('250*2+150')
  const [calculatorResult, setCalculatorResult] = useState(650)

  useEffect(() => {
    localStorage.setItem('workflow-ai-tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('workflow-ai-events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('workflow-ai-chat', JSON.stringify(assistantMessages))
  }, [assistantMessages])

  const completedTasks = tasks.filter((task) => task.completed).length
  const focusHours = useMemo(
    () => tasks.filter((task) => task.category === 'Focus').length * 1.5,
    [tasks]
  )

  const todaySchedule = useMemo(() => {
    return [...tasks, ...events.map((event) => ({
      ...event,
      isEvent: true,
      title: event.title,
      time: event.time,
      category: 'Calendar'
    }))]
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [tasks, events])

  const handleTaskSubmit = (event) => {
    event.preventDefault()
    if (!taskForm.title.trim()) return

    const newTask = {
      id: Date.now(),
      title: taskForm.title.trim(),
      time: taskForm.time,
      date: taskForm.date,
      priority: taskForm.priority,
      category: taskForm.category,
      completed: false,
      notes: taskForm.notes.trim() || 'No notes added.'
    }

    setTasks((current) => [newTask, ...current])
    setTaskForm({
      title: '',
      time: '09:00',
      date: '2026-09-18',
      priority: 'Medium',
      category: 'Work',
      notes: ''
    })
  }

  const toggleTask = (id) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const handleAIAsk = () => {
    const prompt = userPrompt.trim()
    if (!prompt) return

    let response = 'I can help you organize this. Try grouping your work into focus time, follow-ups, and admin blocks.'

    const lower = prompt.toLowerCase()
    if (lower.includes('schedule') || lower.includes('plan')) {
      response = 'Suggested plan: 9:00 team sync, 10:30 deep work, 12:30 follow-ups, 15:00 review and wrap-up.'
    }

    if (lower.includes('priority') || lower.includes('urgent')) {
      response = 'Priority order: clear blockers first, then client communication, then routine follow-ups.'
    }

    if (lower.includes('calendar') || lower.includes('reminder')) {
      response = 'I recommend syncing your key tasks to Apple Reminders and recurring work blocks to Apple Calendar.'
    }

    setAssistantMessages((current) => [
      ...current,
      { sender: 'user', text: prompt },
      { sender: 'ai', text: response }
    ])
    setUserPrompt('')
  }

  const calculate = () => {
    try {
      const result = Function(`"use strict"; return (${calculatorInput})`)()
      setCalculatorResult(Number.isFinite(result) ? result : 'Error')
    } catch {
      setCalculatorResult('Error')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-badge">WF</div>
          <div>
            <p className="eyebrow">Productivity suite</p>
            <h2>WorkFlow AI</h2>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">Calendar</button>
          <button className="nav-item">Reminders</button>
          <button className="nav-item">AI Planner</button>
          <button className="nav-item">Calculator</button>
        </nav>

        <div className="mini-card">
          <p className="eyebrow">Apple sync</p>
          <div className="sync-row">
            <span>Calendar</span>
            <span className={`status-pill ${calendarConnected ? 'online' : 'offline'}`}>
              {calendarConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="sync-row">
            <span>Reminders</span>
            <span className={`status-pill ${remindersConnected ? 'online' : 'offline'}`}>
              {remindersConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Tuesday, Sep 18</p>
            <h1>Work schedule overview</h1>
          </div>
          <div className="top-actions">
            <button className="ghost-btn">Export</button>
            <button className="primary-btn">+ New event</button>
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card accent-blue">
            <p>Total tasks</p>
            <h3>{tasks.length}</h3>
            <span>Scheduled today</span>
          </article>
          <article className="summary-card accent-purple">
            <p>Completed</p>
            <h3>{completedTasks}</h3>
            <span>Finished this week</span>
          </article>
          <article className="summary-card accent-gold">
            <p>Focus time</p>
            <h3>{focusHours.toFixed(1)}h</h3>
            <span>Deep work blocks</span>
          </article>
          <article className="summary-card accent-teal">
            <p>Events</p>
            <h3>{events.length}</h3>
            <span>Calendar events</span>
          </article>
        </section>

        <section className="content-grid">
          <div className="left-stack">
            <div className="panel">
              <div className="panel-header">
                <h3>Plan a task</h3>
                <button className="icon-btn">Quick add</button>
              </div>

              <form className="task-form" onSubmit={handleTaskSubmit}>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />

                <div className="two-col">
                  <input
                    type="date"
                    value={taskForm.date}
                    onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                  />
                  <input
                    type="time"
                    value={taskForm.time}
                    onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })}
                  />
                </div>

                <div className="two-col">
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  >
                    <option value="Work">Work</option>
                    <option value="Focus">Focus</option>
                    <option value="Communication">Communication</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <textarea
                  rows="3"
                  placeholder="Add notes"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                />

                <button type="submit" className="primary-btn wide-btn">Add to schedule</button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Today’s timeline</h3>
                <span className="soft-label">Synced</span>
              </div>

              <div className="timeline-list">
                {todaySchedule.map((item) => (
                  <div key={item.id + (item.isEvent ? '-event' : '-task')} className="timeline-item">
                    <div className="time-dot" />
                    <div className="timeline-copy">
                      <div className="title-row">
                        <strong>{item.title}</strong>
                        <span className={`tag ${item.isEvent ? 'calendar-tag' : 'task-tag'}`}>
                          {item.isEvent ? 'Calendar' : item.category}
                        </span>
                      </div>
                      <p>{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right-stack">
            <div className="panel ai-panel">
              <div className="panel-header">
                <h3>AI planner</h3>
                <span className="soft-label">Smart assistance</span>
              </div>

              <div className="chat-box">
                {assistantMessages.map((message, index) => (
                  <div key={index} className={`chat-message ${message.sender}`}>
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  placeholder="Ask AI to plan my day..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                />
                <button className="primary-btn" onClick={handleAIAsk}>Send</button>
              </div>
            </div>

            <div className="panel calculator-panel">
              <div className="panel-header">
                <h3>Calculator</h3>
                <span className="soft-label">Quick math</span>
              </div>

              <input
                type="text"
                value={calculatorInput}
                onChange={(e) => setCalculatorInput(e.target.value)}
                className="calculator-input"
              />

              <div className="calc-actions">
                <button className="primary-btn" onClick={calculate}>Calculate</button>
                <div className="result-box">{String(calculatorResult)}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
