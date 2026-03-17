import {Command} from '@oclif/core'
import readline from 'node:readline'

export default class AiCommand extends Command {
    static strict = false

    async processPrompt(prompt: string) {
        this.log(`🧑:${prompt}`)
        this.log(`🛠:${prompt}`)
        this.log(`🗄:${prompt}`)
        this.log('🤖:TEXT');
        // Имитация задержки ответа нейросети
        this.log(`🤖 Думаю над: "${prompt}"...`)
        await new Promise(resolve => {
            setTimeout(resolve, 1000)
        })
        this.log('🤖 Ответ: Вот ваш результат!\n')
    }

    async run(): Promise<void> {
        const {argv} = await this.parse(AiCommand)
        const prompt = argv.join(' ')

        // Если передали аргументы (например, для теста)
        if (prompt) {
            await this.processPrompt(prompt)
            return // ВАЖНО: Выходим, чтобы тест не завис!
        }

        // Иначе запускаем интерактивный режим
        this.startInteractiveChat()
    }

    startInteractiveChat() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        const askQuestion = () => {
            rl.question('Вы: ', async (answer) => {
                if (answer.toLowerCase() === 'exit' || answer.toLowerCase() === 'quit') {
                    this.log('Пока!')
                    rl.close()
                    return
                }

                if (answer.trim()) {
                    await this.processPrompt(answer)
                }

                askQuestion() // Спрашиваем снова
            })
        }

        askQuestion()
    }
}