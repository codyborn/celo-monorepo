import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { getNodeVmName, getVmSshCommand, indexCoercer } from 'src/lib/vm-testnet-utils'
import yargs from 'yargs'

export const command = 'ssh-vm-node <nodeType> [nodeIndex]'

export const describe =
  'Generates a command to ssh into a vm-testnet node. To execute the ssh command, run `eval $(<this cmd>)`'

interface SshVmNodeArgv extends CeloEnvArgv {
  nodeType: 'validator' | 'tx-node' | 'bootnode' | 'proxy'
  nodeIndex?: number
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .positional('nodeType', {
      describe: 'Type of node',
      choices: ['validator', 'tx-node', 'bootnode', 'proxy'],
      type: 'string',
    })
    .positional('nodeIndex', {
      describe: 'Index of the node. Only needed for validator or tx-node',
      type: 'string',
      coerce: indexCoercer,
    })
    .check((checkArgv: SshVmNodeArgv) => {
      if (checkArgv.nodeType !== 'bootnode' && checkArgv.nodeIndex === undefined) {
        return new Error(`nodeIndex is required for nodeType ${checkArgv.nodeType}`)
      }
      return true
    })
}

export const handler = async (argv: SshVmNodeArgv) => {
  const instanceName = await getNodeVmName(argv.celoEnv, argv.nodeType, argv.nodeIndex)
  console.info(getVmSshCommand(instanceName))
}
