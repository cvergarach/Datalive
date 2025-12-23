import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/stats
 * Get aggregated statistics for the dashboard
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch counts in parallel
        const [
            { data: projects, error: projectsError },
            { data: apis, error: apisError },
            { data: apiData, error: dataError },
            { data: insights, error: insightsError }
        ] = await Promise.all([
            supabaseAdmin.from('projects').select('id').eq('owner_id', userId),
            supabaseAdmin.from('discovered_apis').select('id, project_id').eq('project_id',
                supabaseAdmin.from('projects').select('id').eq('owner_id', userId)
            ),
            supabaseAdmin.from('api_data').select('record_count').eq('project_id',
                supabaseAdmin.from('projects').select('id').eq('owner_id', userId)
            ),
            supabaseAdmin.from('insights').select('id').eq('project_id',
                supabaseAdmin.from('projects').select('id').eq('owner_id', userId)
            )
        ]);

        // Note: The nested queries above might not work exactly as intended in Supabase JS client depending on RLS.
        // Let's refine the approach to be more robust.

        // 1. Get all project IDs owned by the user
        const { data: userProjects, error: upError } = await supabaseAdmin
            .from('projects')
            .select('id')
            .eq('owner_id', userId);

        if (upError) throw upError;

        const projectIds = userProjects.map(p => p.id);

        if (projectIds.length === 0) {
            return res.json({
                stats: [
                    { name: 'Total Projects', value: '0', change: '0%' },
                    { name: 'Active APIs', value: '0', change: '0%' },
                    { name: 'Data Points', value: '0', change: '0%' },
                    { name: 'Insights Generated', value: '0', change: '0%' }
                ],
                recentActivity: []
            });
        }

        // 2. Fetch all related counts
        const [
            { count: apisCount },
            { data: recordsData },
            { count: insightsCount },
            { data: recentActivity }
        ] = await Promise.all([
            supabaseAdmin.from('discovered_apis').select('*', { count: 'exact', head: true }).in('project_id', projectIds),
            supabaseAdmin.from('api_data').select('record_count').in('project_id', projectIds),
            supabaseAdmin.from('insights').select('*', { count: 'exact', head: true }).in('project_id', projectIds),
            supabaseAdmin.from('api_documents').select('title, created_at, status').in('project_id', projectIds).order('created_at', { ascending: false }).limit(5)
        ]);

        const totalDataPoints = recordsData?.reduce((sum, item) => sum + (item.record_count || 0), 0) || 0;

        // Formatting counts for display
        const formatValue = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        };

        res.json({
            stats: [
                { name: 'Total Projects', value: projectIds.length.toString(), change: '+0%', icon: 'FileText' },
                { name: 'Active APIs', value: (apisCount || 0).toString(), change: '+0%', icon: 'Database' },
                { name: 'Data Points', value: formatValue(totalDataPoints), change: '+0%', icon: 'BarChart3' },
                { name: 'Insights Generated', value: (insightsCount || 0).toString(), change: '+0%', icon: 'TrendingUp' }
            ],
            recentActivity: recentActivity?.map(act => ({
                id: Math.random().toString(),
                description: `Document "${act.title}" is ${act.status}`,
                time: new Date(act.created_at).toLocaleString()
            })) || []
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
