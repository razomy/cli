import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('cli', () => {
  it('add and remove', async () => {
    const {stdout} = await runCommand('cli add @razomy/string-case')
    expect(stdout).to.contain('Installing')
    const {stdout : stdout2} = await runCommand('cli remove @razomy/string-case')
    expect(stdout2).to.contain('removed')
  })
})
