import { AxiosStatic, AxiosInstance } from "axios";

const axios = jest.genMockFromModule<jest.Mocked<AxiosStatic>>("axios");

Object.assign(axios, {
    create: jest.fn(() => <Partial<AxiosInstance>>({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    })),
});

export default axios;
