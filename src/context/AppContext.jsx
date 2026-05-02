import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await window.api.invoke('config:get_all')
      setConfig(cfg)
    } catch (e) {
      console.error('Config load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const updateConfig = useCallback(async (clave, valor) => {
    await window.api.invoke('config:set', { clave, valor })
    setConfig(prev => ({ ...prev, [clave]: valor }))
  }, [])

  // Format amount as "Bs. 1.234,56"
  const fmt = useCallback((ves) => {
    return `Bs. ${Number(ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  return (
    <AppContext.Provider value={{ config, loading, loadConfig, updateConfig, fmt }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
