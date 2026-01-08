import { supabaseAdmin } from '../config/supabase.js';
import mcpClient from './mcp-client.js';

/**
 * Service to automatically generate insights and dashboards
 * when new data is captured.
 */
class IntelligenceService {
    /**
     * Triggers the intelligence pipeline for a project based on new data
     */
    async triggerAutoIntelligence(projectId, newData) {
        try {
            console.log(`🤖 Auto-Intelligence triggered for project ${projectId}...`);

            // 1. Generate Business Insights
            // We send the new data + some recent context for better analysis
            const { data: recentData } = await supabaseAdmin
                .from('api_data')
                .select('data')
                .eq('project_id', projectId)
                .order('executed_at', { ascending: false })
                .limit(2);

            const contextData = [newData, ...(recentData || [])];

            console.log(`🧠 Auto-generating insights...`);
            const insightResult = await mcpClient.generateInsights(projectId, contextData);

            if (insightResult.insights && insightResult.insights.length > 0) {
                const insightsToInsert = insightResult.insights.map(insight => ({
                    project_id: projectId,
                    type: insight.type,
                    title: insight.title,
                    description: insight.description,
                    confidence: insight.confidence,
                    metadata: {
                        actionable_next_step: insight.actionable_next_step,
                        auto_generated: true,
                        generated_at: new Date().toISOString()
                    }
                }));

                await supabaseAdmin.from('insights').insert(insightsToInsert);
                console.log(`✅ Auto-saved ${insightsToInsert.length} insights.`);
            }

            // 2. Update/Recreate Dashboards
            // The user wants dashboards to update with each new data
            console.log(`📊 Auto-updating dashboards...`);
            const dashboardResult = await mcpClient.suggestDashboards(projectId, contextData);

            if (dashboardResult.dashboards && dashboardResult.dashboards.length > 0) {
                // We deactivate old dashboards of the same project and insert new ones
                // or we could update the existing one. For simplicity and to show "freshness",
                // we'll insert the new one as active.

                const dashboardsToInsert = dashboardResult.dashboards.map(db => ({
                    project_id: projectId,
                    title: db.title + " (Auto-Updated)",
                    config: { widgets: db.widgets },
                    is_active: true
                }));

                // Option: Deactivate previous auto-generated dashboards to keep it clean
                await supabaseAdmin
                    .from('dashboards')
                    .update({ is_active: false })
                    .eq('project_id', projectId);

                await supabaseAdmin.from('dashboards').insert(dashboardsToInsert);
                console.log(`✅ Auto-saved ${dashboardsToInsert.length} dashboard(s).`);
            }

        } catch (error) {
            console.error('❌ Auto-Intelligence Error:', error.message);
        }
    }
}

export default new IntelligenceService();
