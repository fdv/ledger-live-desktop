// @flow
import React, { PureComponent, Fragment } from 'react'
import { translate } from 'react-i18next'
import { colors } from 'styles/theme'

import type { T } from 'types/common'

import Box from 'components/base/Box'
import IconWriteSeed from 'icons/illustrations/WriteSeed'
import IconChevronRight from 'icons/ChevronRight'

import {
  Title,
  Description,
  IconOptionRow,
  DisclaimerBox,
  OptionRow,
  Inner,
} from '../../helperComponents'

type Props = {
  t: T,
}

class WriteSeedBlue extends PureComponent<Props, *> {
  render() {
    const { t } = this.props

    const steps = [
      {
        key: 'step1',
        icon: <IconOptionRow>1.</IconOptionRow>,
        desc: t('onboarding:writeSeed.blue.step1'),
      },
      {
        key: 'step2',
        icon: <IconOptionRow>2.</IconOptionRow>,
        desc: t('onboarding:writeSeed.blue.step2'),
      },
      {
        key: 'step3',
        icon: <IconOptionRow>3.</IconOptionRow>,
        desc: t('onboarding:writeSeed.blue.step3'),
      },
    ]
    const disclaimerNotes = [
      {
        key: 'note1',
        icon: <IconChevronRight size={12} style={{ color: colors.smoke }} />,
        desc: t('onboarding:writeSeed.disclaimer.note1'),
      },
      {
        key: 'note2',
        icon: <IconChevronRight size={12} style={{ color: colors.smoke }} />,
        desc: t('onboarding:writeSeed.disclaimer.note2'),
      },
      {
        key: 'note3',
        icon: <IconChevronRight size={12} style={{ color: colors.smoke }} />,
        desc: t('onboarding:writeSeed.disclaimer.note3'),
      },
      {
        key: 'note4',
        icon: <IconChevronRight size={12} style={{ color: colors.smoke }} />,
        desc: t('onboarding:writeSeed.disclaimer.note4'),
      },
    ]

    return (
      <Fragment>
        <Box mb={3}>
          <Title>{t('onboarding:writeSeed.blue.title')}</Title>
          <Description>{t('onboarding:writeSeed.blue.desc')}</Description>
        </Box>
        <Box align="center">
          <Inner style={{ width: 760 }}>
            <Box style={{ width: 260, justifyContent: 'center', alignItems: 'center' }}>
              <IconWriteSeed />
            </Box>
            <Box shrink flow={2} m={0}>
              {steps.map(step => <OptionRow key={step.key} step={step} />)}
            </Box>
          </Inner>
          <DisclaimerBox mt={6} disclaimerNotes={disclaimerNotes} />
        </Box>
      </Fragment>
    )
  }
}

export default translate()(WriteSeedBlue)
