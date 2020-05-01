const TestToken = artifacts.require('TestToken')

module.exports = async (deployer, network) => {
  if (network === 'development' || network === 'develop' || network === 'test') {
    await deployer.deploy(TestToken)
  }
}
