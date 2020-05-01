const SwapperFactory = artifacts.require('SwapperFactory')
const Swapper = artifacts.require('Swapper')

module.exports = async (deployer) => {
  await deployer.deploy(Swapper)
  await deployer.deploy(SwapperFactory, Swapper.address)
}
