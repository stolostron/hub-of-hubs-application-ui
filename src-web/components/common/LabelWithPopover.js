// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Label, Popover } from '@patternfly/react-core'
import resources from '../../../lib/shared/resources'

resources(() => {
  require('../../../scss/label-with-popover.scss')
})

const LabelWithPopover = ({
  children,
  labelContent,
  labelIcon,
  labelColor,
  popoverHeader,
  popoverPosition
}) => (
  <div className="label-with-popover">
    <Popover
      headerContent={popoverHeader}
      bodyContent={children}
      className="label-with-popover"
      enableFlip
      hasAutoWidth
      minWidth="18.75rem"
      maxWidth="30rem"
      position={popoverPosition || 'bottom'}
      flipBehavior={['bottom', 'top', 'right', 'left']}
      zIndex={999}
    >
      <Label
        onClick={event => {
          event.preventDefault()
          event.nativeEvent.preventDefault()
          event.stopPropagation()
        }}
        color={labelColor || 'grey'}
        href="#"
        icon={labelIcon}
      >
        {labelContent}
      </Label>
    </Popover>
  </div>
)

LabelWithPopover.propTypes = {
  children: PropTypes.object,
  labelColor: PropTypes.string,
  labelContent: PropTypes.node,
  labelIcon: PropTypes.object,
  popoverHeader: PropTypes.node,
  popoverPosition: PropTypes.string
}

export default LabelWithPopover
