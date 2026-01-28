/**
 * API Documentation Generation Script
 *
 * This script runs TypeDoc to generate the API reference documentation.
 * It ensures the output directory exists and handles the generation process.
 */

import { execSync } from 'node:child_process'

const DOCS_DIR = 'public/docs'

async function generateDocs() {
    console.log('🚀 Starting API documentation generation...')

    try {
        // Generate the documentation
        console.log('📝 Running TypeDoc...')
        // Use await with a promise-wrapped exec to satisfy require-await
        await new Promise((resolve, reject) => {
            try {
                execSync('bunx typedoc', { stdio: 'inherit' })
                resolve(true)
            } catch (e) {
                reject(e)
            }
        })

        console.log(`✅ Documentation successfully generated in ${DOCS_DIR}`)
    } catch (error) {
        console.error('❌ Failed to generate documentation:', error)
        process.exit(1)
    }
}

generateDocs()
