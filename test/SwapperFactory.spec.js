const SwapperFactory = artifacts.require('SwapperFactory')
const TestToken = artifacts.require('TestToken')

const { performSwap } = require('./helpers')
const { generateContractAddressFromFactory } = require('../../functions/generateContractAddress')

contract('SwapperFactory', (accounts) => {
  describe('constructor', () => {
    it('should deploy a Swapper library', async () => {
      const factory = await SwapperFactory.deployed()

      const swapperLibrary = await factory.swapperLibrary()
      assert.notEqual(
        swapperLibrary,
        `0x${'0'.repeat(40)}`,
        'Incorrect swapper library address set on factory.'
      )
    })
  })

  describe('performSwap', () => {
    it('should revert if it is not called by primary account', async () => {
      try {
        await performSwap(accounts, { fromAccount: accounts[2] })
        assert.fail('The transaction should have thrown an error')
      } catch (err) {
        assert.include(err.message, 'Only the admin address can call this function.', 'Admin address did not call performSwap')
      }
    })

    it('should emit an event when swap performed', async () => {
      const { response } = await performSwap(accounts, {
        fundContract: true
      })

      assert.notEqual(
        response.logs.length,
        0,
        'No events emitted.'
      )

      const { event, args } = response.logs[0]

      assert.equal(
        event,
        'SwapPerformed',
        'Event name incorrect.'
      )
      assert.equal(
        'user' in args,
        true,
        'Expected event to have parameter `user`.'
      )
    })

    it('should take a commission from balance', async () => {
      const fundAmount = 1000000000
      const commissionAmount = 1000000
      const commissionDestination = accounts[2]

      const beforeBalance = await web3.eth.getBalance(commissionDestination)

      const { response } = await performSwap(accounts, {
        fundContract: true,
        fundAmount,
        commissionAmount,
        commissionDestination
      })

      const afterBalance = await web3.eth.getBalance(commissionDestination)

      assert.equal(
          parseInt(afterBalance),
          parseInt(beforeBalance) + commissionAmount,
          'Commission balance not updated'
      )
    })
  })

  describe('createClone', () => {
  })

  describe('getCloneBytecode', () => {
  })

  describe('isContract', () => {
  })

  describe('computeAddress', () => {
    it('should compute the same address as module', async () => {
      const factory = await SwapperFactory.deployed()
      const swapperLibrary = await factory.swapperLibrary()

      const userAddress = '0x86349020e9394b2BE1b1262531B0C3335fc32F20'
      const sourceAsset = '0x6b175474e89094c44da98b954eedeac495271d0f'
      const destinationAsset = '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
      const uniqueId = 'some really random unique id'

      const onchainSalt = await factory.computeCloneSalt(userAddress, sourceAsset, destinationAsset, uniqueId)
      const onchainAddress = await factory.computeAddress(onchainSalt)
      const computedAddress = generateContractAddressFromFactory(userAddress, sourceAsset, destinationAsset, uniqueId, factory.address, swapperLibrary)
      assert.equal(
        computedAddress,
        onchainAddress,
        'Computed clone addresses do not match.'
      )
    })
  })
})
