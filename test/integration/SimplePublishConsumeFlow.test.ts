import { assert } from 'chai'
import { SHA256 } from 'crypto-js'
import { AbiItem } from 'web3-utils'
import { web3, getTestConfig, getAddresses } from '../config'
import {
  Config,
  ProviderInstance,
  Aquarius,
  NftFactory,
  NftCreateData,
  Datatoken,
  getHash,
  Nft,
  downloadFile,
  ZERO_ADDRESS,
  calculateEstimatedGas,
  sendTx
} from '../../src'
import { ProviderFees, DatatokenCreateParams, DDO, Files } from '../../src/@types'

describe('Simple Publish & consume test', async () => {
  let config: Config
  let addresses: any
  let aquarius: Aquarius
  let providerUrl: any
  let publisherAccount: string
  let consumerAccount: string

  const assetUrl: Files = {
    datatokenAddress: '0x0',
    nftAddress: '0x0',
    files: [
      {
        type: 'url',
        url: 'https://raw.githubusercontent.com/oceanprotocol/testdatasets/main/shs_dataset_test.txt',
        method: 'GET'
      }
    ]
  }

  const ddo: DDO = {
    '@context': ['https://w3id.org/did/v1'],
    id: '',
    version: '4.1.0',
    chainId: 4,
    nftAddress: '0x0',
    metadata: {
      created: '2021-12-20T14:35:20Z',
      updated: '2021-12-20T14:35:20Z',
      type: 'dataset',
      name: 'dataset-name',
      description: 'Ocean protocol test dataset description',
      author: 'oceanprotocol-team',
      license: 'MIT'
    },
    services: [
      {
        id: 'testFakeId',
        type: 'access',
        files: '',
        datatokenAddress: '0x0',
        serviceEndpoint: 'https://v4.provider.goerli.oceanprotocol.com',
        timeout: 0
      }
    ]
  }

  before(async () => {
    config = await getTestConfig(web3)
    aquarius = new Aquarius(config.metadataCacheUri)
    providerUrl = config.providerUri

    addresses = getAddresses()
  })

  it('Initialize accounts', async () => {
    const accounts = await web3.eth.getAccounts()
    publisherAccount = accounts[0]
    consumerAccount = accounts[1]

    // mint Ocean tokens
    /// <!--
    // mint ocean to publisherAccount
    const minAbi = [
      {
        constant: false,
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' }
        ],
        name: 'mint',
        outputs: [{ name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ] as AbiItem[]
    const tokenContract = new web3.eth.Contract(minAbi, addresses.Ocean)
    const estGas = await calculateEstimatedGas(
      publisherAccount,
      tokenContract.methods.mint,
      publisherAccount,
      web3.utils.toWei('1000')
    )
    await sendTx(
      publisherAccount,
      estGas,
      web3,
      1,
      tokenContract.methods.mint,
      publisherAccount,
      web3.utils.toWei('1000')
    )
  })

  it('should publish a dataset (create NFT + Datatoken)', async () => {
    const nft = new Nft(web3)
    const datatoken = new Datatoken(web3)
    const Factory = new NftFactory(addresses.ERC721Factory, web3)

    const nftParams: NftCreateData = {
      name: '72120Bundle',
      symbol: '72Bundle',
      templateIndex: 1,
      tokenURI: 'https://oceanprotocol.com/nft/',
      transferable: true,
      owner: publisherAccount
    }

    const datatokenParams: DatatokenCreateParams = {
      templateIndex: 1,
      cap: '100000',
      feeAmount: '0',
      paymentCollector: ZERO_ADDRESS,
      feeToken: ZERO_ADDRESS,
      minter: publisherAccount,
      mpFeeAddress: ZERO_ADDRESS
    }

    const tx = await Factory.createNftWithDatatoken(
      publisherAccount,
      nftParams,
      datatokenParams
    )
    const nftAddress = tx.events.NFTCreated.returnValues[0]
    const datatokenAddress = tx.events.TokenCreated.returnValues[0]

    // create the files encrypted string
    assetUrl.datatokenAddress = datatokenAddress
    assetUrl.nftAddress = nftAddress
    let providerResponse = await ProviderInstance.encrypt(assetUrl, providerUrl)
    ddo.services[0].files = await providerResponse
    ddo.services[0].datatokenAddress = datatokenAddress
    // update ddo and set the right did
    ddo.nftAddress = nftAddress
    const chain = await web3.eth.getChainId()
    ddo.id =
      'did:op:' + SHA256(web3.utils.toChecksumAddress(nftAddress) + chain.toString(10))

    providerResponse = await ProviderInstance.encrypt(ddo, providerUrl)
    const encryptedResponse = await providerResponse
    const metadataHash = getHash(JSON.stringify(ddo))
    await nft.setMetadata(
      nftAddress,
      publisherAccount,
      0,
      providerUrl,
      '',
      '0x2',
      encryptedResponse,
      '0x' + metadataHash
    )

    const resolvedDDO = await aquarius.waitForAqua(ddo.id)
    assert(resolvedDDO, 'Cannot fetch DDO from Aquarius')

    // mint 1 Datatoken and send it to the consumer
    await datatoken.mint(datatokenAddress, publisherAccount, '1', consumerAccount)

    // initialize provider
    const initializeData = await ProviderInstance.initialize(
      resolvedDDO.id,
      resolvedDDO.services[0].id,
      0,
      consumerAccount,
      providerUrl
    )

    const providerFees: ProviderFees = {
      providerFeeAddress: initializeData.providerFee.providerFeeAddress,
      providerFeeToken: initializeData.providerFee.providerFeeToken,
      providerFeeAmount: initializeData.providerFee.providerFeeAmount,
      v: initializeData.providerFee.v,
      r: initializeData.providerFee.r,
      s: initializeData.providerFee.s,
      providerData: initializeData.providerFee.providerData,
      validUntil: initializeData.providerFee.validUntil
    }

    // make the payment
    const txid = await datatoken.startOrder(
      datatokenAddress,
      consumerAccount,
      consumerAccount,
      0,
      providerFees
    )

    // get the url
    const downloadURL = await ProviderInstance.getDownloadUrl(
      ddo.id,
      consumerAccount,
      ddo.services[0].id,
      0,
      txid.transactionHash,
      providerUrl,
      web3
    )

    assert(downloadURL, 'Provider getDownloadUrl failed')
    try {
      await downloadFile(downloadURL)
    } catch (e) {
      assert.fail('Download failed')
    }
  })
})
