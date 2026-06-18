import request from 'supertest';

import { createApp } from '../app.js';

export const createTestAgent = () => request(createApp());
