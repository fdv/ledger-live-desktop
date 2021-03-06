// @flow
import React from 'react'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { Account } from '@ledgerhq/live-common/lib/types'
import { decodeAccount, encodeAccount } from 'reducers/accounts'
import FeesBitcoinKind from 'components/FeesField/BitcoinKind'
import libcoreScanAccounts from 'commands/libcoreScanAccounts'
import libcoreSyncAccount from 'commands/libcoreSyncAccount'
import libcoreSignAndBroadcast from 'commands/libcoreSignAndBroadcast'
import type { WalletBridge, EditProps } from './types'

const notImplemented = new Error('LibcoreBridge: not implemented')

type Transaction = {
  amount: number,
  feePerByte: number,
  recipient: string,
}

const decodeOperation = (encodedAccount, rawOp) =>
  decodeAccount({ ...encodedAccount, operations: [rawOp] }).operations[0]

const EditFees = ({ account, onChange, value }: EditProps<Transaction>) => (
  <FeesBitcoinKind
    onChange={feePerByte => {
      onChange({ ...value, feePerByte })
    }}
    feePerByte={value.feePerByte}
    account={account}
  />
)

/*
import AdvancedOptionsBitcoinKind from 'components/AdvancedOptions/BitcoinKind'
const EditAdvancedOptions = ({ onChange, value }: EditProps<Transaction>) => (
  <AdvancedOptionsBitcoinKind
    isRBF={value.isRBF}
    onChangeRBF={isRBF => {
      onChange({ ...value, isRBF })
    }}
  />
)
*/

const LibcoreBridge: WalletBridge<Transaction> = {
  scanAccountsOnDevice(currency, devicePath, observer) {
    return libcoreScanAccounts
      .send({
        devicePath,
        currencyId: currency.id,
      })
      .pipe(map(decodeAccount))
      .subscribe(observer)
  },

  synchronize: account =>
    Observable.create(o => {
      // FIXME TODO:
      // - when you implement addPendingOperation you also here need to:
      //   - if there were pendingOperations that are now in operations, remove them as well.
      //   - if there are pendingOperations that is older than a threshold (that depends on blockchain speed typically)
      //     then we probably should trash them out? it's a complex question for UI
      ;(async () => {
        try {
          const rawAccount = encodeAccount(account)
          const rawSyncedAccount = await libcoreSyncAccount.send({ rawAccount }).toPromise()
          const syncedAccount = decodeAccount(rawSyncedAccount)
          o.next(account => {
            const accountOps = account.operations
            const syncedOps = syncedAccount.operations
            const patch: $Shape<Account> = {
              freshAddress: syncedAccount.freshAddress,
              freshAddressPath: syncedAccount.freshAddressPath,
              balance: syncedAccount.balance,
              blockHeight: syncedAccount.blockHeight,
              lastSyncDate: new Date(),
            }

            const hasChanged =
              accountOps.length !== syncedOps.length || // size change, we do a full refresh for now...
              (accountOps.length > 0 &&
                syncedOps.length > 0 &&
                accountOps[0].id !== syncedOps[0].id) // if same size, only check if the last item has changed.

            if (hasChanged) {
              patch.operations = syncedAccount.operations
              patch.pendingOperations = [] // For now, we assume a change will clean the pendings.
            }

            return {
              ...account,
              ...patch,
            }
          })
          o.complete()
        } catch (e) {
          o.error(e)
        }
      })()
      return {
        unsubscribe() {
          // LibcoreBridge: unsub sync not currently implemented
        },
      }
    }),

  pullMoreOperations: () => Promise.reject(notImplemented),

  isRecipientValid: (currency, recipient) => Promise.resolve(recipient.length > 0),

  createTransaction: () => ({
    amount: 0,
    recipient: '',
    feePerByte: 0,
    isRBF: false,
  }),

  editTransactionAmount: (account, t, amount) => ({
    ...t,
    amount,
  }),

  getTransactionAmount: (a, t) => t.amount,

  editTransactionRecipient: (account, t, recipient) => ({
    ...t,
    recipient,
  }),

  getTransactionRecipient: (a, t) => t.recipient,

  EditFees,

  // EditAdvancedOptions,

  isValidTransaction: (a, t) => (t.amount > 0 && t.recipient && true) || false,

  canBeSpent: (a, t) => Promise.resolve(t.amount <= a.balance), // FIXME

  getTotalSpent: (a, t) => Promise.resolve(t.amount), // FIXME

  getMaxAmount: (a, _t) => Promise.resolve(a.balance), // FIXME

  signAndBroadcast: (account, transaction, deviceId) => {
    const encodedAccount = encodeAccount(account)
    return libcoreSignAndBroadcast
      .send({
        account: encodedAccount,
        transaction,
        deviceId,
      })
      .pipe(
        map(e => {
          switch (e.type) {
            case 'broadcasted':
              return {
                type: 'broadcasted',
                operation: decodeOperation(encodedAccount, e.operation),
              }
            default:
              return e
          }
        }),
      )
  },

  addPendingOperation: (account, operation) => ({
    ...account,
    pendingOperations: [operation].concat(account.pendingOperations),
  }),
}

export default LibcoreBridge
