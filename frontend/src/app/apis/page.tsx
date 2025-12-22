import React from 'react';

// Simplified Server Component to ensure module detection.
export default function APIsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        APIs
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage and discover your APIs
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                        APIs
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        This section is coming soon.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Ensure it's treated as a dynamic page if necessary, 
// but for now a simple export is enough.
export const dynamic = 'force-dynamic';
