import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('run', () => {
  it('add and string uppercase', async () => {
    await runCommand('cli add @razomy/string-case')
    const {stdout} = await runCommand('run @razomy/string-case upperCase text')
    expect(stdout).to.contain('TEXT')
  })
})
