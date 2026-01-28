import type { ProviderResult, SMSProvider } from '../../contracts'

export class ConsoleProvider implements SMSProvider {
    readonly name = 'console'

    send(to: string, message: string): Promise<ProviderResult> {
        console.log('\n📱 SMS Message')
        console.log(`   To: ${to}`)
        console.log(`   Message: ${message}`)
        console.log('')
        return Promise.resolve({
            success: true,
            messageId: `console-${Date.now()}`,
        })
    }
}
