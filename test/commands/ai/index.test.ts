import { runCommand } from '@oclif/test'
import { expect } from 'chai'

describe('ai command', () => {
  // Тест 1: Прямой запрос с аргументами (One-shot)
  it('should process direct arguments and exit', async () => {
    // В runCommand лучше передавать массив аргументов, но oclif поймет и строку
    // 'ai' - это название команды (в зависимости от того, как назван ваш файл, может быть просто 'ai' или путь)
    const { stdout } = await runCommand(['ai', 'Say', 'hello'])

    // Проверяем, что в выводе (stdout) есть нужный текст
    expect(stdout).to.contain('Вы написали: Say hello')
    expect(stdout).to.contain('🤖 Ответ: TEXT')
  })

  // Тест 2: Проверка многословного запроса
  it('should process multiple arguments as one string', async () => {
    const { stdout } = await runCommand(['ai', 'Find', 'all', 'files', 'in', 'directory'])

    expect(stdout).to.contain('Вы написали: Find all files in directory')
  })
})