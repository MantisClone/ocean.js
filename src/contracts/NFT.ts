import { AbiItem } from 'web3-utils'
import { TransactionReceipt } from 'web3-eth'
import ERC721Template from '@oceanprotocol/contracts/artifacts/contracts/templates/ERC721Template.sol/ERC721Template.json'
import { generateDtName, calculateEstimatedGas, sendTx } from '../utils'
import {
  MetadataProof,
  MetadataAndTokenURI,
  NftRoles,
  ReceiptOrEstimate
} from '../@types'
import { SmartContract } from './SmartContract'

export class Nft extends SmartContract {
  getDefaultAbi(): AbiItem | AbiItem[] {
    return ERC721Template.abi as AbiItem[]
  }

  /**
   * Create new ERC20 Datatoken - only user with DatatokenDeployer permission can succeed
   * @param {String} nftAddress NFT address
   * @param {String} address User address
   * @param {String} minter User set as initial minter for the Datatoken
   * @param {String} paymentCollector initial paymentCollector for this DT
   * @param {String} mpFeeAddress Consume marketplace fee address
   * @param {String} feeToken address of the token marketplace wants to add fee on top
   * @param {String} feeAmount amount of feeToken to be transferred to mpFeeAddress on top, will be converted to WEI
   * @param {String} cap Maximum cap (Number) - will be converted to wei
   * @param {String} name Token name
   * @param {String} symbol Token symbol
   * @param {Number} templateIndex NFT template index
   * @return {Promise<string>} ERC20 Datatoken address
   */
  public async createDatatoken<G extends boolean = false>(
    nftAddress: string,
    address: string,
    minter: string,
    paymentCollector: string,
    mpFeeAddress: string,
    feeToken: string,
    feeAmount: string,
    cap: string,
    name?: string,
    symbol?: string,
    templateIndex?: number,
    estimateGas?: G
  ): Promise<G extends false ? string : number> {
    if ((await this.getNftPermissions(nftAddress, address)).deployERC20 !== true) {
      throw new Error(`Caller is not DatatokenDeployer`)
    }
    if (!templateIndex) templateIndex = 1

    // Generate name & symbol if not present
    if (!name || !symbol) {
      ;({ name, symbol } = generateDtName())
    }

    // Create 721contract object
    const nftContract = this.getContract(nftAddress)

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.createERC20,
      templateIndex,
      [name, symbol],
      [minter, paymentCollector, mpFeeAddress, feeToken],
      [this.web3.utils.toWei(cap), this.web3.utils.toWei(feeAmount)],
      []
    )
    if (estimateGas) return <G extends false ? string : number>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.createERC20,
      templateIndex,
      [name, symbol],
      [minter, paymentCollector, mpFeeAddress, feeToken],
      [this.web3.utils.toWei(cap), this.web3.utils.toWei(feeAmount)],
      []
    )

    return trxReceipt?.events?.TokenCreated?.returnValues?.[0]
  }

  /**
   * Add Manager for NFT Contract (only NFT Owner can succeed)
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Owner adress
   * @param {String} manager User adress which is going to be assing manager
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async addManager<G extends boolean = false>(
    nftAddress: string,
    address: string,
    manager: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftOwner(nftAddress)) !== address) {
      throw new Error(`Caller is not NFT Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.addManager,
      manager
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.addManager,
      manager
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Removes a specific manager for NFT Contract (only NFT Owner can succeed)
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Owner adress
   * @param {String} manager User adress which is going to be removed as manager
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async removeManager<G extends boolean = false>(
    nftAddress: string,
    address: string,
    manager: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftOwner(nftAddress)) !== address) {
      throw new Error(`Caller is not NFT Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.removeManager,
      manager
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.removeManager,
      manager
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Add DatatokenDeployer permission - only Manager can succeed
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Manager adress
   * @param {String} datatokenDeployer User adress which is going to have DatatokenDeployer permission
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async addDatatokenDeployer<G extends boolean = false>(
    nftAddress: string,
    address: string,
    datatokenDeployer: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftPermissions(nftAddress, address)).manager !== true) {
      throw new Error(`Caller is not Manager`)
    }

    // Estimate gas for addToCreateERC20List method
    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.addToCreateERC20List,
      datatokenDeployer
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.addToCreateERC20List,
      datatokenDeployer
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Remove DatatokenDeployer permission - only Manager can succeed
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Manager adress
   * @param {String} datatokenDeployer Address of the user to be revoked DatatokenDeployer Permission
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async removeDatatokenDeployer<G extends boolean = false>(
    nftAddress: string,
    address: string,
    datatokenDeployer: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if (
      (await this.getNftPermissions(nftAddress, address)).manager !== true ||
      (address === datatokenDeployer &&
        (await this.getNftPermissions(nftAddress, address)).deployERC20 !== true)
    ) {
      throw new Error(`Caller is not Manager nor DatatokenDeployer`)
    }
    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.removeFromCreateERC20List,
      datatokenDeployer
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.removeFromCreateERC20List,
      datatokenDeployer
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Add Metadata Updater permission - only Manager can succeed
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Manager adress
   * @param {String} metadataUpdater User adress which is going to have Metadata Updater permission
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async addMetadataUpdater<G extends boolean = false>(
    nftAddress: string,
    address: string,
    metadataUpdater: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftPermissions(nftAddress, address)).manager !== true) {
      throw new Error(`Caller is not Manager`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.addToMetadataList,
      metadataUpdater
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.addToMetadataList,
      metadataUpdater
    )
    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Remove Metadata Updater permission - only Manager can succeed
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Manager adress
   * @param {String} metadataUpdater Address of the user to be revoked Metadata updater Permission
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async removeMetadataUpdater<G extends boolean = false>(
    nftAddress: string,
    address: string,
    metadataUpdater: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if (
      (await this.getNftPermissions(nftAddress, address)).manager !== true ||
      (address !== metadataUpdater &&
        (await this.getNftPermissions(nftAddress, address)).updateMetadata !== true)
    ) {
      throw new Error(`Caller is not Manager nor Metadata Updater`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.removeFromMetadataList,
      metadataUpdater
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.removeFromMetadataList,
      metadataUpdater
    )
    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Add Store Updater permission - only Manager can succeed
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Manager adress
   * @param {String} storeUpdater User adress which is going to have Store Updater permission
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async addStoreUpdater<G extends boolean = false>(
    nftAddress: string,
    address: string,
    storeUpdater: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftPermissions(nftAddress, address)).manager !== true) {
      throw new Error(`Caller is not Manager`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.addTo725StoreList,
      storeUpdater
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.addTo725StoreList,
      storeUpdater
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Remove Store Updater permission - only Manager can succeed
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Manager adress
   * @param {String} storeUpdater Address of the user to be revoked Store Updater Permission
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async removeStoreUpdater<G extends boolean = false>(
    nftAddress: string,
    address: string,
    storeUpdater: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if (
      (await this.getNftPermissions(nftAddress, address)).manager !== true ||
      (address !== storeUpdater &&
        (await this.getNftPermissions(nftAddress, address)).store !== true)
    ) {
      throw new Error(`Caller is not Manager nor storeUpdater`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.removeFrom725StoreList,
      storeUpdater
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.removeFrom725StoreList,
      storeUpdater
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * This function allows to remove all ROLES at NFT level: Managers, DatatokenDeployer, MetadataUpdater, StoreUpdater
   * Even NFT Owner has to readd himself as Manager
   * Permissions at Datatoken level stay.
   * Only NFT Owner  can call it.
   * @param {String} nftAddress NFT contract address
   * @param {String} address NFT Owner adress
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async cleanPermissions<G extends boolean = false>(
    nftAddress: string,
    address: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftOwner(nftAddress)) !== address) {
      throw new Error(`Caller is not NFT Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.cleanPermissions
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.cleanPermissions
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Transfers the NFT
   * will clean all permissions both on NFT and Datatoken level.
   * @param {String} nftAddress NFT contract address
   * @param {String} nftOwner Current NFT Owner adress
   * @param {String} nftReceiver User which will receive the NFT, will also be set as Manager
   * @param {Number} tokenId The id of the token to be transfered
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async transferNft<G extends boolean = false>(
    nftAddress: string,
    nftOwner: string,
    nftReceiver: string,
    tokenId?: number,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftOwner(nftAddress)) !== nftOwner) {
      throw new Error(`Caller is not NFT Owner`)
    }

    const tokenIdentifier = tokenId || 1

    const estGas = await calculateEstimatedGas(
      nftOwner,
      nftContract.methods.transferFrom,
      nftOwner,
      nftReceiver,
      tokenIdentifier
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      nftOwner,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.transferFrom,
      nftOwner,
      nftReceiver,
      tokenIdentifier
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * safeTransferNFT Used for transferring the NFT, can be used by an approved relayer
   * will clean all permissions both on NFT and Datatoken level.
   * @param {String} nftAddress NFT contract address
   * @param {String} nftOwner Current NFT Owner adress
   * @param {String} nftReceiver User which will receive the NFT, will also be set as Manager
   * @param {Number} tokenId The id of the token to be transfered
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async safeTransferNft<G extends boolean = false>(
    nftAddress: string,
    nftOwner: string,
    nftReceiver: string,
    tokenId?: number,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if ((await this.getNftOwner(nftAddress)) !== nftOwner) {
      throw new Error(`Caller is not NFT Owner`)
    }

    const tokenIdentifier = tokenId || 1

    const estGas = await calculateEstimatedGas(
      nftOwner,
      nftContract.methods.safeTransferFrom,
      nftOwner,
      nftReceiver,
      tokenIdentifier
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      nftOwner,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.safeTransferFrom,
      nftOwner,
      nftReceiver,
      tokenIdentifier
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Creates or update Metadata cached by Aquarius. Also, updates the METADATA_DECRYPTOR key
   * @param {String} nftAddress NFT contract address
   * @param {String} address Caller address NFT Owner adress
   * @param {String} address Caller address NFT Owner adress
   * @param {String} address Caller address NFT Owner adress
   * @param {String} address Caller address NFT Owner adress
   * @param {String} address Caller address NFT Owner adress
   * @param {String} address Caller address NFT Owner adress
   * @param {String} address Caller address NFT Owner adress
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async setMetadata<G extends boolean = false>(
    nftAddress: string,
    address: string,
    metadataState: number,
    metadataDecryptorUrl: string,
    metadataDecryptorAddress: string,
    flags: string,
    data: string,
    metadataHash: string,
    metadataProofs?: MetadataProof[],
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)
    if (!metadataProofs) metadataProofs = []
    if (!(await this.getNftPermissions(nftAddress, address)).updateMetadata) {
      throw new Error(`Caller is not Metadata updater`)
    }
    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.setMetaData,
      metadataState,
      metadataDecryptorUrl,
      metadataDecryptorAddress,
      flags,
      data,
      metadataHash,
      metadataProofs
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.setMetaData,
      metadataState,
      metadataDecryptorUrl,
      metadataDecryptorAddress,
      flags,
      data,
      metadataHash,
      metadataProofs
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   *  Helper function to improve UX sets both MetaData & TokenURI in one tx
   * @param {String} nftAddress NFT contract address
   * @param {String} address Caller address
   * @param {MetadataAndTokenURI} metadataAndTokenURI metaDataAndTokenURI object
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async setMetadataAndTokenURI<G extends boolean = false>(
    nftAddress: string,
    metadataUpdater: string,
    metadataAndTokenURI: MetadataAndTokenURI,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)
    if (!(await this.getNftPermissions(nftAddress, metadataUpdater)).updateMetadata) {
      throw new Error(`Caller is not Metadata updater`)
    }
    const sanitizedMetadataAndTokenURI = {
      ...metadataAndTokenURI,
      metadataProofs: metadataAndTokenURI.metadataProofs || []
    }
    const estGas = await calculateEstimatedGas(
      metadataUpdater,
      nftContract.methods.setMetaDataAndTokenURI,
      sanitizedMetadataAndTokenURI
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      metadataUpdater,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.setMetaDataAndTokenURI,
      sanitizedMetadataAndTokenURI
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * setMetadataState Used for updating the metadata State
   * @param {String} nftAddress NFT contract address
   * @param {String} address Caller address => metadata updater
   * @param {Number} metadataState new metadata state
   * @return {Promise<ReceiptOrEstimate>} trxReceipt
   */
  public async setMetadataState<G extends boolean = false>(
    nftAddress: string,
    address: string,
    metadataState: number,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    if (!(await this.getNftPermissions(nftAddress, address)).updateMetadata) {
      throw new Error(`Caller is not Metadata updater`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.setMetaDataState,
      metadataState
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.setMetaDataState,
      metadataState
    )
    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /** set TokenURI on an nft
   * @param nftAddress NFT contract address
   * @param address user adress
   * @param data input data for TokenURI
   * @return {Promise<ReceiptOrEstimate>} transaction receipt
   */
  public async setTokenURI<G extends boolean = false>(
    nftAddress: string,
    address: string,
    data: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const nftContract = this.getContract(nftAddress)

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.setTokenURI,
      '1',
      data
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.setTokenURI,
      '1',
      data
    )
    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /** Get Owner
   * @param {String} nftAddress NFT contract address
   * @return {Promise<string>} string
   */
  public async getNftOwner(nftAddress: string): Promise<string> {
    const nftContract = this.getContract(nftAddress)
    const trxReceipt = await nftContract.methods.ownerOf(1).call()
    return trxReceipt
  }

  /** Get users NFT Permissions
   * @param {String} nftAddress NFT contract address
   * @param {String} address user adress
   * @return {Promise<NftRoles>}
   */
  public async getNftPermissions(nftAddress: string, address: string): Promise<NftRoles> {
    const nftContract = this.getContract(nftAddress)
    const roles = await nftContract.methods.getPermissions(address).call()
    return roles
  }

  /** Get users Metadata, return Metadata details
   * @param {String} nftAddress NFT contract address
   * @return {Promise<Objecta>}
   */
  public async getMetadata(nftAddress: string): Promise<Object> {
    const nftContract = this.getContract(nftAddress)
    return await nftContract.methods.getMetaData().call()
  }

  /** Get users DatatokenDeployer role
   * @param {String} nftAddress NFT contract address
   * @param {String} address user adress
   * @return {Promise<boolean>}
   */
  public async isDatatokenDeployer(
    nftAddress: string,
    address: string
  ): Promise<boolean> {
    const nftContract = this.getContract(nftAddress)
    const isDatatokenDeployer = await nftContract.methods.isERC20Deployer(address).call()
    return isDatatokenDeployer
  }

  /** setData
   * This function allows to store data with a preset key (keccak256(ERC20Address)) into NFT 725 Store
   * only ERC20Deployer can succeed
   * @param nftAddress erc721 contract adress
   * @param address user adress
   * @param key Key of the data to be stored into 725Y standard
   * @param value Data to be stored into 725Y standard
   * @return {Promise<ReceiptOrEstimate>} transactionId
   */
  public async setData(
    nftAddress: string,
    address: string,
    key: string,
    value: string
  ): Promise<TransactionReceipt> {
    if ((await this.getNftPermissions(nftAddress, address)).store !== true) {
      throw new Error(`User is not ERC20 store updater`)
    }

    const nftContract = this.getContract(nftAddress)

    const keyHash = this.web3.utils.keccak256(key)
    const valueHex = this.web3.utils.asciiToHex(value)

    const estGas = await calculateEstimatedGas(
      address,
      nftContract.methods.setNewData,
      keyHash,
      valueHex
    )

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      nftContract.methods.setNewData,
      keyHash,
      valueHex
    )

    return trxReceipt
  }

  /** Gets data at a given `key`
   * @param {String} nftAddress NFT contract address
   * @param {String} key the key which value to retrieve
   * @return {Promise<string>} The data stored at the key
   */
  public async getData(nftAddress: string, key: string): Promise<string> {
    const nftContract = this.getContract(nftAddress)
    const keyHash = this.web3.utils.keccak256(key)
    const data = await nftContract.methods.getData(keyHash).call()
    return data ? this.web3.utils.hexToAscii(data) : null
  }

  /** Gets data at a given `key`
   * @param {String} nftAddress NFT contract address
   * @param {String} id
   * @return {Promise<string>} The data stored at the key
   */
  public async getTokenURI(nftAddress: string, id: number): Promise<string> {
    const nftContract = this.getContract(nftAddress)
    const data = await nftContract.methods.tokenURI(id).call()
    return data
  }
}
