import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { RefreshCcw } from 'lucide-react'

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    useEffect(() => {
        if (offlineReady) {
            toast.success('App ready to work offline', {
                id: 'offline-ready',
                duration: 3000
            })
            setOfflineReady(false)
        }
    }, [offlineReady, setOfflineReady])

    useEffect(() => {
        if (needRefresh) {
            toast(
                (t) => (
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <span className="font-semibold text-sm text-slate-100">
                            Nueva versión disponible
                        </span>
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                                onClick={() => {
                                    updateServiceWorker(true)
                                    // Fallback to reload manually if it doesn't automatically trigger via SW controllerchange
                                    setTimeout(() => window.location.reload(), 500)
                                }}
                            >
                                <RefreshCcw size={14} />
                                Actualizar
                            </button>
                            <button
                                className="px-3 py-1.5 border border-slate-600 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                                onClick={() => {
                                    setNeedRefresh(false)
                                    toast.dismiss(t.id)
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                ),
                {
                    id: 'new-content-available',
                    duration: Infinity,
                    position: 'bottom-right',
                    style: {
                        background: '#1e293b', // slate-800
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '1rem',
                        padding: '1rem',
                        zIndex: 9999,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    }
                }
            )
        }
    }, [needRefresh, setNeedRefresh, updateServiceWorker])

    return null
}
