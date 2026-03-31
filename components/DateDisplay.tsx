'use client'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

// Client-only date rendering to avoid hydration mismatch
// Server renders empty string, client fills in after mount

export function TimeAgo({ date }: { date: string }) {
  const [text, setText] = useState('')
  useEffect(() => {
    setText(formatDistanceToNow(new Date(date), { addSuffix: true }))
  }, [date])
  return <>{text}</>
}

export function DateStr({ date, options }: { date: string; options?: Intl.DateTimeFormatOptions }) {
  const [text, setText] = useState('')
  useEffect(() => {
    setText(new Date(date).toLocaleDateString('en-GB', options || { day: 'numeric', month: 'short' }))
  }, [date, options])
  return <>{text}</>
}

export function DateTimeStr({ date }: { date: string }) {
  const [text, setText] = useState('')
  useEffect(() => {
    setText(new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))
  }, [date])
  return <>{text}</>
}
