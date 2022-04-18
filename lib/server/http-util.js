/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

var querystring = require('querystring'),
    url = require('url')

/**
 * Returns the full URL of the given request options, including qs request params (redacted).
 */
exports.requestUrl = function(options) {
  if (options.qs) {
    var qs = options.qs,
        query = []
    for (var i in qs) {
      if (options.hasOwnProperty(qs[i])) {
        query.push(
          encodeURIComponent(i) + '=' + encodeURIComponent(options.qs[i])
        )
      }
    }
    if (query.length) {
      return (options.url += '?' + query.join('&'))
    }
  }
  return redactUrl(options.url)
}

/**
 * Serializes the incoming HTTP request. Body will be included if it's parsed (req.body).
 * Useful for printing out requests for debugging.
 */
exports.serializeIncomingRequest = function(req) {
  // request line
  var buf = [req.method, ' ', redactUrl(req.originalUrl), ' HTTP/1.1\n']

  // headers
  if (req.headers) {
    for (var i in req.headers) {
      if (req.headers.hasOwnProperty(i)) {
        var value = redactHeader(i, req.headers[i])
        buf.push(capitalizeHeaderName(i), ': ', value, '\n')
      }
    }
  }
  if (req.body && typeof req.body === 'string') {
    buf.push('\n', redactBody(req.body), '\n')
  }
  return buf.join('')
}

/**
 * Serializes the outgoing HTTP request described by the given "request" module options object.
 * Useful for printing out requests for debugging.
 */
exports.serializeRequest = function(options) {
  // request line
  var buf = [
    options.method || 'GET',
    ' ',
    exports.requestUrl(options),
    ' HTTP/1.1\n'
  ]

  // headers
  if (options.json) {
    buf.push('Accept: application/json\n')
  }
  var isJSON = typeof options.json === 'object'
  var isForm = options.form
  if (isJSON) {
    buf.push('Content-Type: application/json\n')
  } else if (isForm) {
    buf.push('Content-Type: application/x-www-form-urlencoded\n')
  }
  for (var i in options.headers) {
    if (options.headers.hasOwnProperty(i)) {
      var value = redactHeader(i, options.headers[i])
      buf.push(i, ': ', value, '\n')
    }
  }

  // body
  var body = options.body
  if (!body) {
    if (isJSON) {
      body = JSON.stringify(options.json)
    } else if (isForm) {
      body = querystring.stringify(options.form)
    }
  }
  if (body) {
    buf.push('\n', redactBody(body), '\n')
  }
  return buf.join('')
}

/**
 * Serializes the response from an outgoing HTTP request. Useful for printing out requests for
 * debugging.
 */
exports.serializeResponse = function(res) {
  // status line
  var buf = ['HTTP/', res.httpVersion, ' ', res.statusCode, '\n']

  // headers
  for (var i in res.headers) {
    if (res.headers.hasOwnProperty(i)) {
      var value = redactHeader(i, res.headers[i])
      buf.push(capitalizeHeaderName(i), ': ', value, '\n')
    }
  }

  // body
  if (res.body) {
    var body = redactBody(
      typeof res.body === 'object' ? JSON.stringify(res.body) : res.body
    )
    buf.push('\n', body, '\n')
  }
  return buf.join('')
}

exports.getOptions = function(req, url) {
  return {
    url: url,
    qs: req.query
  }
}

/*
 * Capitalizes a lower-case header name, e.g. 'set-cookie' -> 'Set-Cookie'. Response headers
 * are only provided in lower-case, for some reason.
 */
function capitalizeHeaderName(headerName) {
  if (headerName.indexOf('x-com-ibm') === 0) {
    return 'X' + headerName.substring(1)
  }
  return headerName.replace(/([a-z])([a-z]*)/g, (match, p1, p2) => {
    return p1.toUpperCase() + p2
  })
}

/*
 * Remove any sensitive information from request/response body.
 */
function redactBody(body) {
  if (typeof body === 'string') {
    return body
      .replace(/("[^"]*password":)"[^"]*"/gi, '$1"***"') // eslint-disable-line no-useless-escape
      .replace(/("[^"]*access_token":)"[^"]*"/gi, '$1"***"') // eslint-disable-line no-useless-escape
  }
  return body
}

/*
 * Remove any sensitive information from http headers.
 */
function redactHeader(name, value) {
  name = name.toLowerCase()
  switch (name) {
  case 'authorization':
    // show the first word if there are multiple (e.g. 'Bearer', 'Basic')
    var words = value.split(' ')
    return words.length > 1 ? words[0] + ' ***' : '***'
  case 'cookie':
  case 'x-auth-token':
    return '***'
  }
  return value
}

/*
 * Remove any sensitive information from URLs.
 */
function redactUrl(urlParam) {
  try {
    var urlObj = url.parse(urlParam),
        query = urlObj.query
    if (query) {
      var queryObj = querystring.parse(query)
      for (var i in queryObj) {
        switch (i) {
        case 'token':
          if (queryObj.hasOwnProperty(i)) {
            queryObj[i] = '***'
          }
        }
      }
      urlObj.query = querystring.stringify(queryObj)
      urlObj.search = '?' + urlObj.query
      return url.format(urlObj)
    }
    return urlParam
  } catch (e) {
    // couldn't parse url... skip redaction
    return urlParam
  }
}
