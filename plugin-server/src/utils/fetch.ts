// This module wraps node-fetch with a sentry tracing-aware extension

import fetch, { type RequestInfo, type RequestInit, type Response, FetchError, Request } from 'node-fetch'
import { URL } from 'url'

import { runInSpan } from '../sentry'
import { isProdEnv } from './env-utils'

export async function trackedFetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const request = new Request(url, init)
    return await runInSpan(
        {
            op: 'fetch',
            description: `${request.method} ${request.url}`,
        },
        async () => {
            if (isProdEnv() && !process.env.NODE_ENV?.includes('functional-tests')) {
                raiseIfUserProvidedUrlUnsafe(request.url)
            }
            return await fetch(url, init)
        }
    )
}

trackedFetch.isRedirect = fetch.isRedirect
trackedFetch.FetchError = FetchError

/**
 * Raise if the provided URL seems unsafe, otherwise do nothing.
 *
 * Equivalent of Django raise_if_user_provided_url_unsafe.
 */
export function raiseIfUserProvidedUrlUnsafe(url: string): void {
    // Raise if the provided URL seems unsafe, otherwise do nothing.
    let parsedUrl: URL
    try {
        parsedUrl = new URL(url)
    } catch (err) {
        throw new FetchError('Invalid URL', 'posthog-host-guard')
    }
    if (!parsedUrl.hostname) {
        throw new FetchError('No hostname', 'posthog-host-guard')
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new FetchError('Scheme must be either HTTP or HTTPS', 'posthog-host-guard')
    }
}
