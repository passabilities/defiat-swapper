const TotlePrimary = artifacts.require('TotlePrimary')

module.exports = async (deployer, network) => {
  if (network === 'development' || network === 'develop' || network === 'test') {
    await deployer.deploy(TotlePrimary)
  }
}
