import { AbiItem } from 'web3-utils'
import FactoryRouter from '@oceanprotocol/contracts/artifacts/contracts/pools/FactoryRouter.sol/FactoryRouter.json'
import { calculateEstimatedGas, sendTx } from '../utils'
import { Operation, ReceiptOrEstimate } from '../@types'
import { SmartContractWithAddress } from './SmartContractWithAddress'

/**
 * Provides an interface for FactoryRouter contract
 */
export class Router extends SmartContractWithAddress {
  getDefaultAbi(): AbiItem | AbiItem[] {
    return FactoryRouter.abi as AbiItem[]
  }

  /**
   * buyDatatokenBatch
   * @param {String} address
   * @param {Operation} operations Operations objects array
   * @return {Promise<ReceiptOrEstimate>} Transaction receipt
   */
  public async buyDatatokenBatch<G extends boolean = false>(
    address: string,
    operations: Operation[],
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.buyDTBatch,
      operations
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.buyDTBatch,
      operations
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /** Check if a token is on approved tokens list, if true opfFee is lower in pools with that token/DT
   * @return {Promise<boolean>} true if is on the list.
   */
  public async isApprovedToken(address: string): Promise<boolean> {
    return await this.contract.methods.isApprovedToken(address).call()
  }

  /** Check if an address is a Fixed Rate contract.
   * @return {Promise<boolean>} true if is a Fixed Rate contract
   */
  public async isFixedPrice(address: string): Promise<boolean> {
    return await this.contract.methods.isFixedRateContract(address).call()
  }

  /** Get Router Owner
   * @return {Promise<string>} Router Owner address
   */
  public async getOwner(): Promise<string> {
    return await this.contract.methods.routerOwner().call()
  }

  /** Get NFT Factory address
   * @return {Promise<string>} NFT Factory address
   */
  public async getNFTFactory(): Promise<string> {
    return await this.contract.methods.factory().call()
  }

  /**
   * Adds a token to the list of tokens with reduced fees
   * @param {String} address caller address
   * @param {String} tokenAddress token address to add
   * @return {Promise<ReceiptOrEstimate>}
   */
  public async addApprovedToken<G extends boolean = false>(
    address: string,
    tokenAddress: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    if ((await this.getOwner()) !== address) {
      throw new Error(`Caller is not Router Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.addApprovedToken,
      tokenAddress
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.addApprovedToken,
      tokenAddress
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Removes a token if exists from the list of tokens with reduced fees
   * @param {String} address
   * @param {String} tokenAddress address to remove
   * @return {Promise<ReceiptOrEstimate>}
   */
  public async removeApprovedToken<G extends boolean = false>(
    address: string,
    tokenAddress: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    if ((await this.getOwner()) !== address) {
      throw new Error(`Caller is not Router Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.removeApprovedToken,
      tokenAddress
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.removeApprovedToken,
      tokenAddress
    )
    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Adds an address to the list of fixed rate contracts
   * @param {String} address
   * @param {String} tokenAddress contract address to add
   * @return {Promise<ReceiptOrEstimate>}
   */
  public async addFixedRateContract<G extends boolean = false>(
    address: string,
    tokenAddress: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    if ((await this.getOwner()) !== address) {
      throw new Error(`Caller is not Router Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.addFixedRateContract,
      tokenAddress
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.addFixedRateContract,
      tokenAddress
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Removes an address from the list of fixed rate contracts
   * @param {String} address
   * @param {String} tokenAddress contract address to add
   * @return {Promise<ReceiptOrEstimate>}
   */
  public async removeFixedRateContract<G extends boolean = false>(
    address: string,
    tokenAddress: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    if ((await this.getOwner()) !== address) {
      throw new Error(`Caller is not Router Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.removeFixedRateContract,
      tokenAddress
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.removeFixedRateContract,
      tokenAddress
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Adds an address to the list of dispensers
   * @param {String} address
   * @param {String} tokenAddress contract address to add
   * @return {Promise<ReceiptOrEstimate>}
   */
  public async addDispenserContract<G extends boolean = false>(
    address: string,
    tokenAddress: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    if ((await this.getOwner()) !== address) {
      throw new Error(`Caller is not Router Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.addDispenserContract,
      tokenAddress
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.addDispenserContract,
      tokenAddress
    )
    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /**
   * Removes an address from the list of dispensers
   * @param {String} address
   * @param {String} tokenAddress address Contract to be removed
   * @return {Promise<ReceiptOrEstimate>}
   */
  public async removeDispenserContract<G extends boolean = false>(
    address: string,
    tokenAddress: string,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    if ((await this.getOwner()) !== address) {
      throw new Error(`Caller is not Router Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.removeDispenserContract,
      tokenAddress
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.removeDispenserContract,
      tokenAddress
    )
    return <ReceiptOrEstimate<G>>trxReceipt
  }

  /** Get OPF Fee per token
   * @return {Promise<number>} OPC fee for a specific baseToken
   */
  public async getOPCFee(baseToken: string): Promise<number> {
    return await this.contract.methods.getOPCFee(baseToken).call()
  }

  /** Get Current OPF Fee
   * @return {Promise<number>} OPF fee
   */
  public async getCurrentOPCFee(): Promise<number> {
    return await this.contract.methods.swapOceanFee().call()
  }

  /**
   * Updates OP Community Fees
   * @param {String} address
   * @param {number} newSwapOceanFee Amount charged for swapping with ocean approved tokens
   * @param {number} newSwapNonOceanFee Amount charged for swapping with non ocean approved tokens
   * @param {number} newConsumeFee Amount charged from consumeFees
   * @param {number} newProviderFee Amount charged for providerFees
   * @return {Promise<ReceiptOrEstimate>}
   */
  public async updateOPCFee<G extends boolean = false>(
    address: string,
    newSwapOceanFee: number,
    newSwapNonOceanFee: number,
    newConsumeFee: number,
    newProviderFee: number,
    estimateGas?: G
  ): Promise<ReceiptOrEstimate<G>> {
    if ((await this.getOwner()) !== address) {
      throw new Error(`Caller is not Router Owner`)
    }

    const estGas = await calculateEstimatedGas(
      address,
      this.contract.methods.updateOPCFee,
      newSwapOceanFee,
      newSwapNonOceanFee,
      newConsumeFee,
      newProviderFee
    )
    if (estimateGas) return <ReceiptOrEstimate<G>>estGas

    const trxReceipt = await sendTx(
      address,
      estGas + 1,
      this.web3,
      this.config?.gasFeeMultiplier,
      this.contract.methods.updateOPCFee,
      newSwapOceanFee,
      newSwapNonOceanFee,
      newConsumeFee,
      newProviderFee
    )

    return <ReceiptOrEstimate<G>>trxReceipt
  }
}
