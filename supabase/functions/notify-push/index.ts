import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // El payload viene del trigger de la tabla notificaciones o una invocación manual
        const payload = await req.json()
        const record = payload.record || payload // Manejar ambos casos (webhook o invocación directa)

        if (!record) throw new Error('No record provided')

        // 1. Buscar suscripciones activas
        // NOTA: Se podrían filtrar por usuario si la notificación tuviera un target_user_id
        // Para labores críticas, enviamos a todos los que tengan suscripción activa (analistas, tecnicos, etc)
        const { data: subscriptions, error: subError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')

        if (subError) throw subError
        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Configuración de Web Push
        const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
        const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')

        if (!vapidPublic || !vapidPrivate) {
            throw new Error('VAPID keys not configured in Edge Function environment')
        }

        webpush.setVapidDetails(
            'mailto:soporte@riopaila.com',
            vapidPublic,
            vapidPrivate
        )

        const pushPromises = subscriptions.map((sub) => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.auth,
                    p256dh: sub.p256dh
                }
            }

            return webpush.sendNotification(
                pushConfig,
                JSON.stringify({
                    title: record.titulo || 'Riopaila Agricola',
                    body: record.mensaje || 'Actualización de labor',
                    url: '/dashboard'
                })
            ).catch(async (err) => {
                // Si el endpoint ya no existe (uninstalled pwa, revoked permission)
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseClient
                        .from('push_subscriptions')
                        .delete()
                        .eq('id', sub.id)
                }
                console.error(`Error sending push to ${sub.id}:`, err)
            })
        })

        await Promise.all(pushPromises)

        return new Response(JSON.stringify({ success: true, sent_to: subscriptions.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
