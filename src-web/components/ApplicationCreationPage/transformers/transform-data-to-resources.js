/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.

 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import _ from 'lodash'

// remove the kube stuff
const kube = [
  'managedFields',
  'creationTimestamp',
  'status',
  'uid',
  'deployables',
  'livenessProbe',
  'resourceVersion',
  'generation'
]

const keepKeys = [
  'apps.open-cluster-management.io/github-branch',
  'apps.open-cluster-management.io/github-path',
  'apps.open-cluster-management.io/git-branch',
  'apps.open-cluster-management.io/git-path',
  'apps.open-cluster-management.io/reconcile-option',
  'apps.open-cluster-management.io/git-desired-commit',
  'apps.open-cluster-management.io/git-tag',
  'apps.open-cluster-management.io/git-clone-depth',
  'apps.open-cluster-management.io/reconcile-rate',
  'apps.open-cluster-management.io/manual-refresh-time',
  'apps.open-cluster-management.io/bucket-path',
  'apps.open-cluster-management.io/deployables' //needed by the topology to show deployable information
]

export const isFiltered = (value, key, parentKey, parentObj) => {
  if (
    key === 'status' &&
    parentObj &&
    _.get(parentObj, 'type', '') === 'ManagedClusterConditionAvailable'
  ) {
    // for placement rule online option keep the status
    return false
  }
  if (kube.includes(key)) {
    return true
  }
  if (parentKey === 'annotations' && !keepKeys.includes(key)) {
    return true
  }
  return false
}

const filter = (value, parentKey) => {
  if (typeof value === 'object') {
    return filterDeep(value, parentKey)
  }
  return value
}

const filterDeep = (obj, parentKey) => {
  const newObj = {}
  Object.entries(obj || {}).forEach(([k, v]) => {
    const value = filter(v, k)
    if (!isFiltered(value, k, parentKey, obj)) {
      if (k === 'apps.open-cluster-management.io/github-branch') {
        k = 'apps.open-cluster-management.io/git-branch'
      }
      if (k === 'apps.open-cluster-management.io/github-path') {
        k = 'apps.open-cluster-management.io/git-path'
      }
      newObj[k] = value
    }
  })
  return newObj
}

export const getApplicationResources = application => {
  if (application) {
    const { app, subscriptions } = _.cloneDeep(application)
    const resources = []

    // application
    resources.push(filterDeep(app))

    // for each subscriptions, do channel and rule
    if (Array.isArray(subscriptions)) {
      subscriptions.forEach(subscription => {
        const { channels, rules } = subscription
        delete subscription.channels
        delete subscription.rules
        resources.push(filterDeep(channels[0]))
        resources.push(filterDeep(subscription))
        if (rules && rules.length) {
          resources.push(filterDeep(rules[0]))
        }
      })
    }
    return resources
  }
  return null
}
