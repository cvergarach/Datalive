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
            console.log(`🤖 [AUTO-INTEL] Triggered for project ${projectId}`);

            // 1. Generate Business Insights
            const { data: recentData, error: fetchError } = await supabaseAdmin
                .from('api_data')
                .select('data')
                .eq('project_id', projectId)
                .order('executed_at', { ascending: false })
                .limit(2);

            if (fetchError) console.error(`❌ [AUTO-INTEL] Error fetching recent context:`, fetchError);
            const contextData = [newData, ...(recentData || [])];
            console.log(`🧠 [AUTO-INTEL] Context ready with ${contextData.length} records. Calling MCP...`);

            const insightResult = await mcpClient.generateInsights(projectId, contextData);
            console.log(`📥 [AUTO-INTEL] MCP Insight result:`, insightResult ? (insightResult.insights?.length || 0) + ' insights' : 'NULL');

            if (insightResult && insightResult.insights && insightResult.insights.length > 0) {
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

                const { error: insError } = await supabaseAdmin.from('insights').insert(insightsToInsert);
                if (insError) console.error(`❌ [AUTO-INTEL] Error saving auto-insights:`, insError);
                else console.log(`✅ [AUTO-INTEL] Auto-saved ${insightsToInsert.length} insights.`);
            }

            // 2. Update/Recreate Dashboards
            console.log(`📊 [AUTO-INTEL] Generating dashboard suggestions...`);
            const dashboardResult = await mcpClient.suggestDashboards(projectId, contextData);
            console.log(`📥 [AUTO-INTEL] MCP Dashboard result:`, dashboardResult ? (dashboardResult.dashboards?.length || 0) + ' dashboards' : 'NULL');

            if (dashboardResult && dashboardResult.dashboards && dashboardResult.dashboards.length > 0) {
                const dashboardsToInsert = dashboardResult.dashboards.map(db => ({
                    project_id: projectId,
                    title: db.title + " (Auto-Updated)",
                    config: { widgets: db.widgets },
                    is_active: true
                }));

                // Deactivate old and insert new
                const { error: updError } = await supabaseAdmin
                    .from('dashboards')
                    .update({ is_active: false })
                    .eq('project_id', projectId);

                if (updError) console.error(`❌ [AUTO-INTEL] Error deactivating old dashboards:`, updError);

                const { error: dashInsError } = await supabaseAdmin.from('dashboards').insert(dashboardsToInsert);
                if (dashInsError) console.error(`❌ [AUTO-INTEL] Error saving auto-dashboards:`, dashInsError);
                else console.log(`✅ [AUTO-INTEL] Auto-saved ${dashboardsToInsert.length} dashboard(s).`);
            }

        } catch (error) {
            console.error('❌ [AUTO-INTEL] Critical Error:', error.message);
        }
    }

}

export default new IntelligenceService();
