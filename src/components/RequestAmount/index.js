// @flow

import React, { PureComponent } from 'react'
import { compose } from 'redux'
import { translate } from 'react-i18next'
import styled from 'styled-components'
import { connect } from 'react-redux'
import type { Currency, Account } from '@ledgerhq/live-common/lib/types'

import type { T } from 'types/common'

import {
  counterValueCurrencySelector,
  currencySettingsSelector,
  counterValueExchangeSelector,
  intermediaryCurrency,
} from 'reducers/settings'
import CounterValues from 'helpers/countervalues'

import InputCurrency from 'components/base/InputCurrency'
import Button from 'components/base/Button'
import Box from 'components/base/Box'
import type { State } from 'reducers'

const InputRight = styled(Box).attrs({
  ff: 'Rubik',
  color: 'graphite',
  fontSize: 4,
  justifyContent: 'center',
  pr: 3,
})``

const InputCenter = styled(Box).attrs({
  ff: 'Rubik',
  color: 'graphite',
  fontSize: 4,
  alignItems: 'center',
  justifyContent: 'center',
})`
  width: 30px;
`

type OwnProps = {
  // translation
  t: T,

  // left value (always the one which is returned)
  value: number,

  canBeSpent: boolean,

  // max left value
  max: number,

  // change handler
  onChange: number => void,

  // used to determine the left input unit
  account: Account,

  // display max button
  withMax: boolean,
}

type Props = OwnProps & {
  // used to determine the right input unit
  // retrieved via selector (take the chosen countervalue unit)
  rightCurrency: Currency,

  // used to calculate the opposite field value (right & left)
  getCounterValue: number => ?number,
  getReverseCounterValue: number => ?number,
}

const mapStateToProps = (state: State, props: OwnProps) => {
  const {
    account: { currency },
  } = props
  const counterValueCurrency = counterValueCurrencySelector(state)
  const fromExchange = currencySettingsSelector(state, { currency }).exchange
  const toExchange = counterValueExchangeSelector(state)
  const getCounterValue = value =>
    CounterValues.calculateWithIntermediarySelector(state, {
      from: currency,
      fromExchange,
      intermediary: intermediaryCurrency,
      toExchange,
      to: counterValueCurrency,
      value,
    })

  const getReverseCounterValue = value =>
    CounterValues.reverseWithIntermediarySelector(state, {
      from: currency,
      fromExchange,
      intermediary: intermediaryCurrency,
      toExchange,
      to: counterValueCurrency,
      value,
    })

  return {
    rightCurrency: counterValueCurrency,
    getCounterValue,
    getReverseCounterValue,
  }
}

export class RequestAmount extends PureComponent<Props> {
  static defaultProps = {
    max: Infinity,
    canBeSpent: true,
    withMax: true,
  }

  handleClickMax = () => {
    const { max, onChange } = this.props
    if (isFinite(max)) {
      onChange(max)
    }
  }

  handleChangeAmount = (changedField: string) => (val: number) => {
    const { getReverseCounterValue, max, onChange } = this.props
    if (changedField === 'left') {
      onChange(val > max ? max : val)
    } else if (changedField === 'right') {
      const leftVal = getReverseCounterValue(val) || 0
      onChange(leftVal > max ? max : leftVal)
    }
  }

  renderInputs(containerProps: Object) {
    const { value, account, rightCurrency, getCounterValue, canBeSpent } = this.props
    const right = getCounterValue(value) || 0
    const rightUnit = rightCurrency.units[0]
    return (
      <Box horizontal grow shrink>
        <InputCurrency
          error={canBeSpent ? null : 'Not enough balance'}
          containerProps={containerProps}
          defaultUnit={account.unit}
          value={value}
          onChange={this.handleChangeAmount('left')}
          renderRight={<InputRight>{account.unit.code}</InputRight>}
        />
        <InputCenter>=</InputCenter>
        <InputCurrency
          containerProps={containerProps}
          defaultUnit={rightUnit}
          value={right}
          onChange={this.handleChangeAmount('right')}
          renderRight={<InputRight>{rightUnit.code}</InputRight>}
          showAllDigits
        />
      </Box>
    )
  }

  render() {
    const { withMax, t } = this.props

    return (
      <Box horizontal flow={5} alignItems="center">
        {withMax ? (
          <Box horizontal>{this.renderInputs({ style: { width: 156 } })}</Box>
        ) : (
          this.renderInputs({ grow: true })
        )}
        {withMax && (
          <Box grow justify="flex-end">
            <Button primary onClick={this.handleClickMax}>
              {t('common:max')}
            </Button>
          </Box>
        )}
      </Box>
    )
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(RequestAmount)
