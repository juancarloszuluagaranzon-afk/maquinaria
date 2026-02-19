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
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <span className="font-semibold text-sm text-gray-800 dark:text-white">
                            Nueva versión disponible
                        </span>
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1.5 bg-rp-green-600 hover:bg-rp-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                                onClick={() => updateServiceWorker(true)}
                            >
                                <RefreshCcw size={14} />
                                Actualizar
                            </button>
                            <button
                                className="px-3 py-1.5 border border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors"
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
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    }
                }
            )
        }
    }, [needRefresh, setNeedRefresh, updateServiceWorker])

    return null
}
