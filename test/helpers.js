const SwapperFactory = artifacts.require('SwapperFactory')
const Swapper = artifacts.require('Swapper')
const TotlePrimary = artifacts.require('TotlePrimary')
const TestToken = artifacts.require('TestToken')

const { generateContractAddressFromFactory } = require('../../functions/generateContractAddress')

const validAddress = web3.utils.randomHex(20)
const ethAddress = `0x${'0'.repeat(40)}`

async function generateSwapCollectionPayload(userAddress, sourceToken, sourceAmount) {
  const testToken = await TestToken.deployed()

  if (!userAddress)
    userAddress = validAddress

  if (!sourceToken)
    sourceToken = ethAddress

  if (!sourceAmount)
    sourceAmount = '1000000000000000000'

  return {
    swaps: [{
      trades: [{
        sourceToken: sourceToken,
        destinationToken: testToken.address,
        amount: '1000000000000000000',
        isSourceAmount: true,
        orders: [{
          exchangeHandler: validAddress,
          encodedPayload: web3.utils.randomHex(100)
        }]
      }],
      minimumExchangeRate: '1000000000000000000',
      minimumDestinationAmount: '1000000000000000000',
      sourceAmount,
      tradeToTakeFeeFrom: 0,
      takeFeeFromSource: true,
      redirectAddress: userAddress,
      required: true
    }],
    partnerContract: validAddress,
    expirationBlock: '8000000',
    id: web3.utils.randomHex(16),
    maxGasPrice: '10000000000',
    v: '10',
    r: web3.utils.randomHex(16),
    s: web3.utils.randomHex(16)
  }
}

async function performSwap(accounts, overrides) {
  const factory = await SwapperFactory.deployed()
  const primary = await TotlePrimary.deployed()
  const testToken = await TestToken.deployed()

  const swapperLibrary = await factory.swapperLibrary()

  const params = Object.assign({}, {
    userAddress: '0xcAfe3004538b8E539638A55C775Cffd0807FB552',
    srcTokenAddress: ethAddress,
    dstTokenAddress: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
    commissionAmount: 0,
    commissionDestination: ethAddress,
    uniqueId: 'some-random-unique-id',
    fundContract: false,
    fundAmount: '1000000000',
    fromAccount: accounts[0]
  }, overrides)

  if (params.fundContract) {
    const swapperAddress = generateContractAddressFromFactory(params.userAddress, params.srcTokenAddress, params.dstTokenAddress, params.uniqueId, factory.address, swapperLibrary)

    if (params.srcTokenAddress === ethAddress) {
      await web3.eth.sendTransaction({ from: accounts[1], to: swapperAddress, value: params.fundAmount })
    } else {
      await testToken.transfer(swapperAddress, params.fundAmount)
    }
  }

  const swapCollection = await generateSwapCollectionPayload(params.userAddress, params.srcTokenAddress, params.fundAmount - params.commissionAmount)

  let response
  if (params.commissionAmount > 0) {
    response = await factory.performSwapWithCommission(
      params.userAddress,
      params.srcTokenAddress,
      params.dstTokenAddress,
      params.commissionAmount,
      params.commissionDestination,
      params.uniqueId,
      primary.address,
      swapCollection,
      { from: params.fromAccount }
    )
  } else {
    response = await factory.performSwap(
      params.userAddress,
      params.srcTokenAddress,
      params.dstTokenAddress,
      params.uniqueId,
      primary.address,
      swapCollection,
      { from: params.fromAccount }
    )
  }

  return {
    ...params,
    response
  }
}

module.exports = {
  generateSwapCollectionPayload,
  performSwap
}