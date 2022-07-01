#!/usr/bin/env node

import fetch from 'node-fetch';
import { globalOptions } from './bulkapi.js';

async function fetchRequest(url = '', headers = {}, method = '', returnType = 'JSON', body = '') {
    const requestMethod = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + globalOptions.accessToken
        }
    }
    if (headers) {
        requestMethod.headers = { ...requestMethod.headers, ...headers };
    }
    if (body) {
        requestMethod.body = body;
    }
    const response = await fetch(url, requestMethod);
    return returnType === 'JSON' ? response.json() : returnType === 'TEXT' ? response.text() : response;
}

export { fetchRequest };